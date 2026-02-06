/**
 * Smart LLM Router with Multi-Tier Fallback
 * Optimized for Ollama → DeepSeek Cloud routing
 *
 * Architecture: DeepSite → Ollama (localhost) → DeepSeek V3 Cloud
 * This provides cost-effective, high-quality LLM inference
 */

import { HfInference } from '@huggingface/inference';

// Export types for use in other modules
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  // Optional: control response quality
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface LLMResponse {
  content: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface LLMTier {
  name: string;
  type: 'space' | 'serverless';
  url?: string;
  apiKey?: string;
  model: string;
  timeout: number;
  enabled: boolean;
  // Ollama-specific optimizations
  isOllama?: boolean;
}

/**
 * Build tier configuration from environment variables
 * Optimized for Ollama → DeepSeek routing
 */
function buildTierConfig(): LLMTier[] {
  const tiers: LLMTier[] = [];

  // Tier 1: Ollama (Local) → DeepSeek Cloud (Primary)
  // This is the most cost-effective option
  const tier1Enabled = !!(
    process.env.CUSTOM_LLM_BASE_URL &&
    process.env.CUSTOM_LLM_MODEL
  );

  if (tier1Enabled) {
    const isOllama = process.env.CUSTOM_LLM_BASE_URL?.includes('localhost:11434') ||
                     process.env.CUSTOM_LLM_BASE_URL?.includes('127.0.0.1:11434');

    tiers.push({
      name: isOllama ? 'Tier 1: Ollama → DeepSeek' : 'Tier 1: Custom LLM',
      type: 'space',
      url: process.env.CUSTOM_LLM_BASE_URL,
      apiKey: process.env.CUSTOM_LLM_API_KEY,
      model: process.env.CUSTOM_LLM_MODEL!,
      // Longer timeout for cloud routing (Ollama → DeepSeek can take time)
      timeout: parseInt(process.env.TIER1_TIMEOUT || '180000', 10), // 3 minutes default
      enabled: true,
      isOllama,
    });
  }

  // Tier 2: HuggingFace Serverless Inference (Fast Fallback)
  const tier2Enabled =
    process.env.TIER2_ENABLED !== 'false' &&
    !!(process.env.HF_TOKEN);

  if (tier2Enabled) {
    tiers.push({
      name: 'Tier 2: HF Serverless',
      type: 'serverless',
      model: process.env.TIER2_MODEL || 'deepseek-ai/deepseek-coder-1.3b-instruct',
      timeout: parseInt(process.env.TIER2_TIMEOUT || '60000', 10),
      enabled: true,
    });
  }

  return tiers;
}

/**
 * Call Tier 1 (Ollama / Custom LLM) with timeout
 * Optimized for DeepSeek V3 via Ollama routing
 */
async function callTier1(
  tier: LLMTier,
  request: LLMRequest
): Promise<LLMResponse> {
  if (!tier.url) {
    throw new Error('Tier 1 URL not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), tier.timeout);

  // Optimize parameters for DeepSeek V3 code generation
  const optimizedParams = {
    model: tier.model,
    messages: request.messages,
    // DeepSeek V3 supports up to 64K context, use higher limits for quality
    max_tokens: request.maxTokens || 8192,
    // Slightly lower temperature for more consistent code generation
    temperature: request.temperature ?? 0.6,
    // Top-p sampling for better quality
    top_p: request.topP ?? 0.95,
    // Reduce repetition in generated code
    frequency_penalty: request.frequencyPenalty ?? 0.1,
    presence_penalty: request.presencePenalty ?? 0.1,
    stream: false,
    // Ollama-specific: keep context in memory for faster subsequent requests
    ...(tier.isOllama && {
      keep_alive: '10m', // Keep model loaded for 10 minutes
    }),
  };

  try {
    const response = await fetch(`${tier.url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tier.apiKey && { 'Authorization': `Bearer ${tier.apiKey}` }),
      },
      body: JSON.stringify(optimizedParams),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response format');
    }

    return {
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout after ${tier.timeout}ms - consider increasing TIER1_TIMEOUT`);
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

/**
 * Call Tier 2 (HuggingFace Serverless) with timeout
 */
async function callTier2(
  tier: LLMTier,
  request: LLMRequest
): Promise<LLMResponse> {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error('HF_TOKEN not configured');
  }

  const hf = new HfInference(hfToken);

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${tier.timeout}ms`)), tier.timeout);
  });

  // Convert messages to HF format (simple concatenation for now)
  const prompt = request.messages
    .map((msg) => {
      if (msg.role === 'system') return `System: ${msg.content}`;
      if (msg.role === 'user') return `User: ${msg.content}`;
      return `Assistant: ${msg.content}`;
    })
    .join('\n\n');

  try {
    // Race between API call and timeout
    const response = await Promise.race([
      hf.textGeneration({
        model: tier.model,
        inputs: prompt,
        parameters: {
          max_new_tokens: request.maxTokens || 2048,
          temperature: request.temperature || 0.7,
          return_full_text: false,
        },
      }),
      timeoutPromise,
    ]);

    return {
      content: response.generated_text,
      finishReason: 'stop',
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

/**
 * Call a specific tier with timeout and error handling
 */
async function callTierWithTimeout(
  tier: LLMTier,
  request: LLMRequest
): Promise<LLMResponse> {
  if (tier.type === 'space') {
    return callTier1(tier, request);
  } else if (tier.type === 'serverless') {
    return callTier2(tier, request);
  }

  throw new Error(`Unsupported tier type: ${tier.type}`);
}

/**
 * Main router function - tries tiers in order until success
 * Drop-in replacement for generateWithLLM from llm-client.ts
 *
 * Optimized for: DeepSite → Ollama → DeepSeek V3 Cloud
 */
export async function generateWithLLM(request: LLMRequest): Promise<LLMResponse> {
  const tiers = buildTierConfig();

  if (tiers.length === 0) {
    throw new Error('No LLM tiers configured. Check environment variables.');
  }

  const errors: Array<{ tier: string; error: string }> = [];
  const startTime = Date.now();

  // Log request info
  const totalPromptChars = request.messages.reduce((acc, m) => acc + m.content.length, 0);
  console.log(`🚀 LLM Request: ${request.messages.length} messages, ~${totalPromptChars} chars, max_tokens=${request.maxTokens || 8192}`);

  for (const tier of tiers) {
    if (!tier.enabled) {
      console.log(`⊘ Skipped: ${tier.name} (disabled)`);
      continue;
    }

    const tierStartTime = Date.now();
    console.log(`→ Trying: ${tier.name} (timeout: ${tier.timeout}ms)`);

    try {
      const result = await callTierWithTimeout(tier, request);
      const tierDuration = Date.now() - tierStartTime;
      const totalDuration = Date.now() - startTime;

      // Log success with token usage if available
      if (result.usage) {
        console.log(`✓ Success: ${tier.name} (${tierDuration}ms) - Tokens: ${result.usage.promptTokens} prompt + ${result.usage.completionTokens} completion = ${result.usage.totalTokens} total`);
      } else {
        console.log(`✓ Success: ${tier.name} (${tierDuration}ms, total: ${totalDuration}ms, ~${result.content.length} chars output)`);
      }

      return result;
    } catch (error: unknown) {
      const tierDuration = Date.now() - tierStartTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      console.warn(`✗ Failed: ${tier.name} (${tierDuration}ms) - ${errorMsg}`);
      errors.push({ tier: tier.name, error: errorMsg });

      // Continue to next tier
    }
  }

  // All tiers failed
  const errorSummary = errors
    .map(({ tier, error }) => `${tier}: ${error}`)
    .join('; ');

  throw new Error(`All LLM tiers failed. ${errorSummary}`);
}

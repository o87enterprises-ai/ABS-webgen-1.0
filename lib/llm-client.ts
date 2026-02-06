/**
 * LLM Client for HuggingFace CodeLlama API
 * Uses OpenAI-compatible endpoints
 */

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  finishReason: string;
}

const API_KEY = process.env.CUSTOM_LLM_API_KEY;
const BASE_URL = process.env.CUSTOM_LLM_BASE_URL;
const MODEL = process.env.CUSTOM_LLM_MODEL;

export async function generateWithLLM(request: LLMRequest): Promise<LLMResponse> {
  if (!BASE_URL || !MODEL) {
    throw new Error('LLM API configuration missing. Check CUSTOM_LLM_BASE_URL and CUSTOM_LLM_MODEL');
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
    },
    body: JSON.stringify({
      model: MODEL,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} ${error}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('Invalid LLM API response format');
  }

  return {
    content: data.choices[0].message.content,
    finishReason: data.choices[0].finish_reason,
  };
}

/**
 * Stream response from LLM (for real-time generation)
 */
export async function* streamLLM(request: LLMRequest) {
  if (!BASE_URL || !MODEL) {
    throw new Error('LLM API configuration missing');
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` }),
    },
    body: JSON.stringify({
      model: MODEL,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body from LLM API');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip parsing errors for invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

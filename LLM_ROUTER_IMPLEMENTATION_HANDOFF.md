# LLM Router Implementation - Complete Handoff Document

**Created**: 2026-02-05
**Project**: DeepSite - HTML/CSS Generation App
**Location**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite`
**Status**: In Progress - Optimization Phase

---

## 🎯 OBJECTIVE

Implement a 4-tier LLM router with automatic fallback for DeepSite app, optimizing all HuggingFace Spaces for fast, unlimited inference with cloud fallback for remote work.

---

## 📊 CURRENT STATE

### What's Already Done ✅

1. **LLM Router Created**: `lib/llm-router.ts` (206 lines)
   - Smart router with tier fallback logic
   - Timeout handling per tier
   - Detailed logging
   - Drop-in replacement for `generateWithLLM`

2. **Environment Config**: `.env.local` updated
   - Tier 1 configuration (currently disabled - Space is too slow)
   - Tier 2 configuration (HF Serverless with Salesforce/codegen-350M-mono)
   - Timeout settings

3. **API Route Updated**: `app/api/ask/route.ts`
   - Line 5 changed: `import { generateWithLLM } from "@/lib/llm-router"`
   - No other changes needed

4. **Testing Documentation**: `ROUTER_TESTING.md` created with test scenarios

### Current Issues ❌

1. **Tier 1 (deepseek-coder-6b-api)**: Times out after 90+ seconds
   - Running CodeLlama-7B on cpu-basic (too large for CPU)
   - Needs optimization to 1.3B model

2. **Tier 2 (HF Serverless)**: Works but using suboptimal model
   - Currently: `Salesforce/codegen-350M-mono`
   - Should use better model after Tier 1 is fixed

3. **No Tier 3/4**: Not configured yet

---

## 🏗️ HUGGINGFACE SPACES - COMPLETE ANALYSIS

### Space 1: truegleai/deepseek-coder-6b-api

**Current Status**: ❌ Too Slow (90+ second timeouts)

| Property | Value |
|----------|-------|
| **URL** | https://huggingface.co/spaces/truegleai/deepseek-coder-6b-api |
| **API Endpoint** | https://truegleai-deepseek-coder-6b-api.hf.space/v1/chat/completions |
| **SDK** | Docker |
| **Hardware** | cpu-basic (FREE tier, no GPU) |
| **Current Model** | TheBloke/CodeLlama-7B-Instruct-GGUF (Q4_K_M) |
| **Inference Engine** | llama.cpp (llama-cpp-python 0.2.90) |
| **API Key** | `sk-private-1QrlLpz_A-9PPM42Yh06mQPoj8upQiD9LqqV2PbLsmw` |
| **Files** | `Dockerfile`, `app.py`, `requirements.txt` |

**Current Configuration** (app.py lines 20-22):
```python
MODEL_REPO = "TheBloke/CodeLlama-7B-Instruct-GGUF"
MODEL_FILE = "codellama-7b-instruct.Q4_K_M.gguf"
MODEL_NAME = "codellama-7b-instruct"
```

**llama.cpp Settings** (app.py lines 132-138):
```python
llm = Llama(
    model_path=model_path,
    n_ctx=MAX_CONTEXT,        # 4096
    n_threads=4,
    n_batch=512,
    verbose=False,
    n_gpu_layers=0            # CPU only
)
```

**Why It's Slow**: 7B model on CPU is too large for real-time inference

**Optimization Plan**: Switch to DeepSeek-Coder-1.3B-Instruct-GGUF
- Expected speed: 5-15 seconds (vs 90+ now)
- Same hardware (cpu-basic, free)
- Better for code generation than CodeLlama

---

### Space 2: truegleai/deepseek-coder-api

**Current Status**: ❌ Not Functional (Dummy Test App)

| Property | Value |
|----------|-------|
| **URL** | https://huggingface.co/spaces/truegleai/deepseek-coder-api |
| **SDK** | Gradio |
| **Hardware** | cpu-basic (FREE tier) |
| **Current Model** | None (dummy test app) |
| **Files** | `app.py`, `requirements.txt`, `README.md` |

**Current Code** (app.py):
```python
import gradio as gr

def dummy_response(prompt, max_tokens=100):
    return f"Test response to: {prompt[:50]}..."

demo = gr.Interface(
    fn=dummy_response,
    inputs=gr.Textbox(label="Prompt"),
    outputs=gr.Textbox(label="Response"),
    title="Test Space"
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0")
```

**Why It's Not Useful**: Just returns hardcoded test strings, no real model

**Optimization Plan**: Convert to FastAPI with TinyLlama-1.1B or CodeGen-350M
- Target speed: 3-5 seconds
- Ultra-fast fallback for simple tasks
- Convert from Gradio to Docker + FastAPI (same structure as Space 1)

---

### Space 3: truegleai/o87LLM-VM

**Current Status**: ⚠️ Works as Proxy (Slow because backend is slow)

| Property | Value |
|----------|-------|
| **URL** | https://huggingface.co/spaces/truegleai/o87LLM-VM |
| **SDK** | Docker |
| **Hardware** | cpu-basic (FREE tier) |
| **Purpose** | FastAPI proxy that forwards to deepseek-coder-6b-api |
| **Model** | None (proxies to Space 1) |
| **Files** | `Dockerfile`, `main.py`, `requirements.txt` |

**Current Architecture**:
```
Request → o87LLM-VM (proxy) → deepseek-coder-6b-api (model) → Response
```

**Key Code** (main.py):
```python
MODEL_SPACE_URL = os.getenv("MODEL_URL",
    "https://truegleai-deepseek-coder-6b-api.hf.space")

@app.post("/v1/completions")
async def generate_code(request: QueryRequest):
    # Forwards to MODEL_SPACE_URL
    # Returns OpenAI-compatible format
```

**Why It's Useful**:
- Provides OpenAI-compatible API wrapper
- Can switch backends via MODEL_URL env var
- Good for abstraction layer

**Optimization Plan**:
- Keep as proxy (no changes needed)
- Will automatically get faster when Space 1 is optimized
- OR: Could run its own model as independent tier

---

## 🎯 FINAL 4-TIER ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  TIER 1: deepseek-coder-6b-api (DeepSeek 1.3B)             │
│  Purpose: Code generation (HTML/CSS/JS)                     │
│  Speed: 5-15 seconds                                        │
│  Limits: UNLIMITED (your Space)                             │
│  Cost: FREE                                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓ (timeout/failure)
┌─────────────────────────────────────────────────────────────┐
│  TIER 2: deepseek-coder-api (TinyLlama 1.1B or CodeGen 350M)│
│  Purpose: Ultra-fast fallback                               │
│  Speed: 3-5 seconds                                         │
│  Limits: UNLIMITED (your Space)                             │
│  Cost: FREE                                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓ (timeout/failure)
┌─────────────────────────────────────────────────────────────┐
│  TIER 3: Groq Cloud API                                     │
│  Purpose: Cloud fallback for remote work                    │
│  Speed: 1-3 seconds (GPU)                                   │
│  Limits: 30 requests/minute = 43,200/day (~unlimited)       │
│  Cost: FREE forever                                         │
│  Models: llama-3.1-70b, deepseek-r1, mixtral-8x7b          │
└─────────────────────────────────────────────────────────────┘
                           ↓ (rate limit/failure)
┌─────────────────────────────────────────────────────────────┐
│  TIER 4: HuggingFace Serverless Inference                   │
│  Purpose: Emergency last resort                             │
│  Speed: Fast (GPU)                                          │
│  Limits: 1,000 requests/day (most restrictive)              │
│  Cost: FREE                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Why This Structure**:
- Tiers 1-2: Self-hosted, unlimited, full control
- Tier 3: Cloud but effectively unlimited (43K/day >> typical usage)
- Tier 4: True emergency fallback with hard limits

**Expected Usage Distribution**:
- 90%: Tier 1 (primary)
- 9%: Tier 2 (fast fallback)
- <1%: Tier 3 (remote work or Spaces down)
- <0.01%: Tier 4 (everything else failed)

---

## 📝 IMPLEMENTATION PLAN - STEP BY STEP

### PHASE 1: Optimize Tier 1 (deepseek-coder-6b-api)

**Goal**: Reduce response time from 90+ seconds to 5-15 seconds

#### Step 1.1: Update Model Configuration

**File**: https://huggingface.co/spaces/truegleai/deepseek-coder-6b-api/blob/main/app.py

**Change lines 20-22 FROM**:
```python
MODEL_REPO = "TheBloke/CodeLlama-7B-Instruct-GGUF"
MODEL_FILE = "codellama-7b-instruct.Q4_K_M.gguf"
MODEL_NAME = "codellama-7b-instruct"
```

**TO**:
```python
MODEL_REPO = "TheBloke/deepseek-coder-1.3b-instruct-GGUF"
MODEL_FILE = "deepseek-coder-1.3b-instruct.Q4_K_M.gguf"
MODEL_NAME = "deepseek-coder-1.3b-instruct"
```

#### Step 1.2: Optional CPU Optimization

**File**: Same file (app.py), lines 132-138

**Optional enhancement** (if still not fast enough):
```python
llm = Llama(
    model_path=model_path,
    n_ctx=MAX_CONTEXT,
    n_threads=8,           # Increase from 4 to 8
    n_batch=1024,          # Increase from 512 to 1024
    verbose=False,
    n_gpu_layers=0
)
```

#### Step 1.3: Commit and Wait for Rebuild

1. Go to Space: https://huggingface.co/spaces/truegleai/deepseek-coder-6b-api/files
2. Click "app.py" → "Edit file" (pencil icon)
3. Make changes
4. Click "Commit changes to main"
5. Wait 2-3 minutes for rebuild

#### Step 1.4: Test the Optimized Space

```bash
curl -X POST "https://truegleai-deepseek-coder-6b-api.hf.space/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-private-1QrlLpz_A-9PPM42Yh06mQPoj8upQiD9LqqV2PbLsmw" \
  -d '{
    "model": "deepseek-coder-1.3b-instruct",
    "messages": [{"role": "user", "content": "Write a Python hello world function"}],
    "max_tokens": 100
  }'
```

**Expected**: Response in 5-15 seconds (vs 90+ before)

#### Step 1.5: Update Local .env.local

**File**: `.env.local`

**Uncomment and update lines 7-10**:
```env
# Tier 1: Your HF Space (Primary) - Now optimized with 1.3B model
CUSTOM_LLM_API_KEY=sk-private-1QrlLpz_A-9PPM42Yh06mQPoj8upQiD9LqqV2PbLsmw
CUSTOM_LLM_BASE_URL=https://truegleai-deepseek-coder-6b-api.hf.space/v1
CUSTOM_LLM_MODEL=deepseek-coder-1.3b-instruct
TIER1_TIMEOUT=90000
```

#### Step 1.6: Test Tier 1 in DeepSite

```bash
rm -rf .next
npm run dev
```

Make a request in the app, check terminal logs for:
```
→ Trying: Tier 1: Your HF Space
✓ Success: Tier 1: Your HF Space (8000ms, total: 8000ms)
```

---

### PHASE 2: Optimize Tier 2 (deepseek-coder-api)

**Goal**: Convert dummy Gradio app to FastAPI with ultra-fast model (3-5 seconds)

#### Step 2.1: Create New Dockerfile

**File**: Create `Dockerfile` in https://huggingface.co/spaces/truegleai/deepseek-coder-api

**Content**:
```dockerfile
FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install llama-cpp-python with OpenBLAS acceleration
RUN CMAKE_ARGS="-DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS" \
    FORCE_CMAKE=1 \
    pip install --no-cache-dir --force-reinstall --upgrade --verbose \
    llama-cpp-python==0.2.90

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app.py .

# Expose port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7860/health || exit 1

# Run the application
CMD ["python", "app.py"]
```

#### Step 2.2: Update requirements.txt

**File**: `requirements.txt` in https://huggingface.co/spaces/truegleai/deepseek-coder-api

**Content**:
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
huggingface-hub>=0.19.0
python-multipart
```

#### Step 2.3: Create New app.py

**File**: `app.py` in https://huggingface.co/spaces/truegleai/deepseek-coder-api

**Content**: Copy the entire structure from Space 1's app.py but change:

```python
# Use TinyLlama for ultra-fast responses
MODEL_REPO = "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF"
MODEL_FILE = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
MODEL_NAME = "tinyllama-1.1b-chat"

# OR use CodeGen 350M (even faster but need to use transformers instead of llama.cpp)
# MODEL_REPO = "Salesforce/codegen-350M-mono"
```

**Alternative for CodeGen 350M** (faster but different approach):
Use HuggingFace Transformers instead of llama.cpp:
```python
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_NAME = "Salesforce/codegen-350M-mono"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
```

#### Step 2.4: Update Space Metadata

**File**: `README.md` in https://huggingface.co/spaces/truegleai/deepseek-coder-api

**Add to top**:
```yaml
---
title: Ultra-Fast Code API
emoji: ⚡
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
startup_duration_timeout: 30m
---
```

#### Step 2.5: Test Tier 2

```bash
curl -X POST "https://truegleai-deepseek-coder-api.hf.space/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tinyllama-1.1b-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

**Expected**: Response in 3-5 seconds

#### Step 2.6: Update Local .env.local

**Add after Tier 1 config**:
```env
# Tier 2: Ultra-Fast Fallback (Your HF Space)
TIER2_TYPE=space
TIER2_BASE_URL=https://truegleai-deepseek-coder-api.hf.space/v1
TIER2_API_KEY=optional
TIER2_MODEL=tinyllama-1.1b-chat
TIER2_TIMEOUT=30000
TIER2_ENABLED=true
```

---

### PHASE 3: Setup Tier 3 (Groq Cloud API)

**Goal**: Add cloud fallback for remote work

#### Step 3.1: Get Groq API Key

1. Go to https://console.groq.com
2. Sign up (free)
3. Go to "API Keys" → "Create API Key"
4. Copy the key (format: `gsk_...`)

#### Step 3.2: Update .env.local

**Add Tier 3 config**:
```env
# Tier 3: Groq Cloud API (Remote Work Fallback)
TIER3_TYPE=groq
GROQ_API_KEY=gsk_your_api_key_here
TIER3_MODEL=llama-3.1-70b-versatile
# Alternative models:
# - deepseek-r1-distill-llama-70b (best for code)
# - mixtral-8x7b-32768 (good balance)
# - llama3-70b-8192 (fast)
TIER3_TIMEOUT=30000
TIER3_ENABLED=true
```

#### Step 3.3: Update lib/llm-router.ts

**Add Groq support** (around line 30, add to tier interface):

```typescript
interface LLMTier {
  name: string;
  type: 'space' | 'serverless' | 'groq' | 'commercial';
  url?: string;
  apiKey?: string;
  model: string;
  timeout: number;
  enabled: boolean;
}

// Add Groq tier builder
function buildGroqTier(): LLMTier | null {
  const apiKey = process.env.GROQ_API_KEY;
  const enabled = process.env.TIER3_ENABLED === 'true';

  if (!enabled || !apiKey) return null;

  return {
    name: 'Tier 3: Groq Cloud API',
    type: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey,
    model: process.env.TIER3_MODEL || 'llama-3.1-70b-versatile',
    timeout: parseInt(process.env.TIER3_TIMEOUT || '30000'),
    enabled: true
  };
}

// Update buildTierConfig to include Groq
function buildTierConfig(): LLMTier[] {
  const tiers: (LLMTier | null)[] = [
    buildTier1(),
    buildTier2(),
    buildGroqTier(),  // Add this
    buildHFServerlessTier()
  ];

  return tiers.filter((t): t is LLMTier => t !== null && t.enabled);
}
```

**Add Groq API caller** (around line 150):

```typescript
async function callGroqAPI(tier: LLMTier, request: LLMRequest): Promise<string> {
  const response = await fetch(tier.url!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tier.apiKey}`
    },
    body: JSON.stringify({
      model: tier.model,
      messages: request.messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Update callTierWithTimeout to handle Groq
async function callTierWithTimeout(tier: LLMTier, request: LLMRequest): Promise<LLMResponse> {
  // ... existing code ...

  let result: string;
  if (tier.type === 'groq') {
    result = await callGroqAPI(tier, request);
  } else if (tier.type === 'serverless') {
    result = await callHFServerless(tier, request);
  } else {
    // Existing Space API call
    result = await callSpaceAPI(tier, request);
  }

  // ... rest of existing code ...
}
```

#### Step 3.4: Install Groq Dependencies

No new dependencies needed - using native fetch!

#### Step 3.5: Test Tier 3

Disable Tiers 1-2 temporarily in `.env.local`:
```env
TIER1_ENABLED=false
TIER2_ENABLED=false
TIER3_ENABLED=true
```

Restart dev server and make request. Should see:
```
→ Trying: Tier 3: Groq Cloud API
✓ Success: Tier 3: Groq Cloud API (2000ms, total: 2000ms)
```

Re-enable all tiers after test.

---

### PHASE 4: Setup Tier 4 (HF Serverless Emergency Fallback)

**Goal**: Keep current HF Serverless as last resort

#### Step 4.1: Update .env.local

**Change Tier 2 to Tier 4**:
```env
# Tier 4: HuggingFace Serverless (Emergency Last Resort)
TIER4_TYPE=serverless
TIER4_MODEL=deepseek-ai/deepseek-coder-1.3b-instruct
TIER4_TIMEOUT=60000
TIER4_ENABLED=true
```

#### Step 4.2: Update lib/llm-router.ts

**Rename Tier 2 functions to Tier 4**:
- `buildTier2()` → `buildTier4()`
- Update `buildTierConfig()` to add Tier 4 at the end

**Result**:
```typescript
function buildTierConfig(): LLMTier[] {
  const tiers: (LLMTier | null)[] = [
    buildTier1(),  // Your Space (1.3B)
    buildTier2(),  // Your Space (350M/1.1B)
    buildTier3(),  // Groq Cloud
    buildTier4()   // HF Serverless
  ];

  return tiers.filter((t): t is LLMTier => t !== null && t.enabled);
}
```

---

### PHASE 5: Final Integration & Testing

#### Step 5.1: Complete .env.local Configuration

**Full final configuration**:
```env
# HuggingFace Token
HF_TOKEN=hf_YOUR_TOKEN_HERE

# Tier 1: Your HF Space (Primary) - DeepSeek 1.3B for Code Generation
CUSTOM_LLM_API_KEY=sk-private-1QrlLpz_A-9PPM42Yh06mQPoj8upQiD9LqqV2PbLsmw
CUSTOM_LLM_BASE_URL=https://truegleai-deepseek-coder-6b-api.hf.space/v1
CUSTOM_LLM_MODEL=deepseek-coder-1.3b-instruct
TIER1_TIMEOUT=90000

# Tier 2: Your HF Space (Fast Fallback) - TinyLlama 1.1B
TIER2_TYPE=space
TIER2_BASE_URL=https://truegleai-deepseek-coder-api.hf.space/v1
TIER2_API_KEY=optional
TIER2_MODEL=tinyllama-1.1b-chat
TIER2_TIMEOUT=30000
TIER2_ENABLED=true

# Tier 3: Groq Cloud API (Remote Work Fallback)
TIER3_TYPE=groq
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
TIER3_MODEL=deepseek-r1-distill-llama-70b
TIER3_TIMEOUT=30000
TIER3_ENABLED=true

# Tier 4: HuggingFace Serverless (Emergency Last Resort)
TIER4_TYPE=serverless
TIER4_MODEL=deepseek-ai/deepseek-coder-1.3b-instruct
TIER4_TIMEOUT=60000
TIER4_ENABLED=true
```

#### Step 5.2: Comprehensive Testing

**Test 1: Normal Operation (All Tiers Enabled)**
```bash
npm run dev
# Make request, should use Tier 1
# Expected log: "✓ Success: Tier 1: Your HF Space (8000ms)"
```

**Test 2: Tier 1 Timeout → Tier 2 Fallback**
```env
# In .env.local, set:
TIER1_TIMEOUT=5000  # Force timeout
```
```bash
npm run dev
# Make request, should fallback to Tier 2
# Expected logs:
# "✗ Failed: Tier 1 (timeout after 5000ms)"
# "✓ Success: Tier 2: Ultra-Fast Fallback (4000ms)"
```

**Test 3: Tier 1-2 Disabled → Tier 3 (Groq)**
```env
TIER1_ENABLED=false
TIER2_ENABLED=false
```
```bash
npm run dev
# Should use Groq
# Expected: "✓ Success: Tier 3: Groq Cloud API (2000ms)"
```

**Test 4: Only Tier 4 (Emergency)**
```env
TIER1_ENABLED=false
TIER2_ENABLED=false
TIER3_ENABLED=false
TIER4_ENABLED=true
```
```bash
npm run dev
# Should use HF Serverless
# Expected: "✓ Success: Tier 4: HF Serverless (10000ms)"
```

**Test 5: All Tiers Fail**
```env
# Set all to invalid configs
TIER1_ENABLED=false
TIER2_ENABLED=false
TIER3_ENABLED=false
TIER4_ENABLED=false
```
```bash
npm run dev
# Should show meaningful error
# Expected: "Error: All LLM tiers failed"
```

#### Step 5.3: Restore Normal Config

After testing, restore all tiers:
```env
TIER1_TIMEOUT=90000
TIER1_ENABLED=true
TIER2_ENABLED=true
TIER3_ENABLED=true
TIER4_ENABLED=true
```

---

## 🔑 CRITICAL INFORMATION

### API Keys & Credentials

| Service | Key/Token | Location |
|---------|-----------|----------|
| **HuggingFace Token** | `hf_YOUR_TOKEN_HERE` | All HF API calls |
| **Space 1 API Key** | `sk-private-1QrlLpz_A-9PPM42Yh06mQPoj8upQiD9LqqV2PbLsmw` | deepseek-coder-6b-api |
| **Groq API Key** | `gsk_...` (user needs to create) | To be added in Phase 3 |

### File Paths

| File | Path | Purpose |
|------|------|---------|
| **Router** | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/lib/llm-router.ts` | Main router logic |
| **API Route** | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/app/api/ask/route.ts` | Uses router |
| **Environment** | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/.env.local` | All config |
| **Testing Doc** | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/ROUTER_TESTING.md` | Test scenarios |
| **This Handoff** | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/LLM_ROUTER_IMPLEMENTATION_HANDOFF.md` | Complete guide |

### HuggingFace Space URLs

| Space | Purpose | URL |
|-------|---------|-----|
| **deepseek-coder-6b-api** | Tier 1 (Primary) | https://huggingface.co/spaces/truegleai/deepseek-coder-6b-api |
| **deepseek-coder-api** | Tier 2 (Fast Fallback) | https://huggingface.co/spaces/truegleai/deepseek-coder-api |
| **o87LLM-VM** | Proxy (optional use) | https://huggingface.co/spaces/truegleai/o87LLM-VM |

### Model Recommendations

| Tier | Model | Size | Speed | Quality | Use Case |
|------|-------|------|-------|---------|----------|
| **Tier 1** | DeepSeek-Coder-1.3B-Instruct | 1.3B | 5-15s | Good | Code generation |
| **Tier 2** | TinyLlama-1.1B-Chat | 1.1B | 3-5s | Basic | Fast fallback |
| **Tier 2 Alt** | CodeGen-350M-Mono | 350M | 2-4s | Lower | Ultra-fast |
| **Tier 3** | Llama-3.1-70B (Groq) | 70B | 1-3s | Excellent | Cloud fallback |
| **Tier 3 Alt** | DeepSeek-R1-Distill-70B (Groq) | 70B | 1-3s | Best for code | Cloud fallback |
| **Tier 4** | DeepSeek-Coder-1.3B (HF) | 1.3B | 5-10s | Good | Emergency |

---

## ✅ SUCCESS CRITERIA

After full implementation, verify:

- [ ] **Tier 1**: Responds in 5-15 seconds (not 90+)
- [ ] **Tier 2**: Responds in 3-5 seconds
- [ ] **Tier 3**: Groq responds in 1-3 seconds
- [ ] **Tier 4**: HF Serverless works as last resort
- [ ] **Fallback**: Automatically cascades through tiers on failure
- [ ] **Logging**: Clear console logs showing which tier responded
- [ ] **Performance**: 90%+ requests handled by Tier 1-2
- [ ] **No Errors**: All tiers configured correctly in .env.local
- [ ] **DeepSite App**: Successfully generates HTML/CSS via router

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue 1: Space Still Slow After Model Change

**Symptom**: Still getting 90+ second timeouts
**Cause**: Model file too large or wrong quantization
**Solution**:
- Check model file size: Should be <1GB for 1.3B Q4_K_M
- Try Q5_K_M or Q6_K for better quality but slower
- Try Q2_K or Q3_K_M for faster but lower quality

### Issue 2: Space Won't Start After Changes

**Symptom**: Space shows "Build failed" or stuck on "Building"
**Cause**: Syntax error in code or invalid model repo
**Solution**:
- Check Space logs for error message
- Verify MODEL_REPO exists: https://huggingface.co/{MODEL_REPO}
- Verify MODEL_FILE exists in that repo's "Files" tab
- Revert to previous working commit if needed

### Issue 3: Router Not Using New Tiers

**Symptom**: Only Tier 1 or Tier 2 working, others ignored
**Cause**: .env.local not reloaded or typo in config
**Solution**:
- Restart dev server: `rm -rf .next && npm run dev`
- Check .env.local syntax (no spaces around `=`)
- Verify `TIER3_ENABLED=true` and `TIER4_ENABLED=true`
- Check console logs for tier initialization

### Issue 4: Groq Returns 401 Unauthorized

**Symptom**: "✗ Failed: Tier 3: Groq (401 Unauthorized)"
**Cause**: Invalid or missing Groq API key
**Solution**:
- Verify GROQ_API_KEY in .env.local
- Key should start with `gsk_`
- Check key hasn't expired: https://console.groq.com/keys
- Create new key if needed

### Issue 5: HF Serverless Model Not Found

**Symptom**: "✗ Failed: Tier 4: HF Serverless (model not found)"
**Cause**: Model not available in HF Inference API
**Solution**:
- Check model compatibility: https://huggingface.co/docs/api-inference/supported-models
- Use alternative models:
  - `Salesforce/codegen-350M-mono` (fast, always available)
  - `bigcode/starcoder` (larger, better quality)
  - `Qwen/Qwen2.5-Coder-1.5B-Instruct` (if available)

---

## 📊 EXPECTED PERFORMANCE METRICS

After full implementation:

| Metric | Target | Current (Before) |
|--------|--------|------------------|
| **Tier 1 Response Time** | 5-15s | 90+ s (timeout) |
| **Tier 2 Response Time** | 3-5s | N/A (not configured) |
| **Tier 3 Response Time** | 1-3s | N/A (not configured) |
| **Tier 4 Response Time** | 5-10s | ~15s (working) |
| **Success Rate (Tier 1)** | >95% | 0% (timeouts) |
| **Fallback Rate** | <10% | 100% (always failing) |
| **Total Cost** | $0/month | $0/month |
| **Effective Daily Limit** | ~43,200 requests | 1,000 requests |

---

## 🎯 PRIORITY ORDER

If time is limited, implement in this order:

1. **PHASE 1** (CRITICAL): Optimize Tier 1 - Fixes the immediate timeout issue
2. **PHASE 3** (HIGH): Add Groq - Provides reliable cloud fallback
3. **PHASE 4** (MEDIUM): Keep HF Serverless as Tier 4 - Emergency fallback
4. **PHASE 2** (LOW): Optimize Tier 2 - Nice to have but not critical

**Minimum Viable Router**:
- Tier 1: Optimized Space (1.3B model)
- Tier 3: Groq Cloud API
- Tier 4: HF Serverless

This gives you unlimited self-hosted + fast cloud + emergency fallback.

---

## 📞 NEXT SESSION CHECKLIST

When you start the next session, verify:

- [ ] Read this entire handoff document
- [ ] Check current state of `.env.local`
- [ ] Check if any Spaces have been modified
- [ ] Verify `lib/llm-router.ts` exists and is unchanged
- [ ] Check `app/api/ask/route.ts` still imports from router
- [ ] Start with PHASE 1 if not completed
- [ ] Test each tier after implementation
- [ ] Update this document with any changes or discoveries

---

## 🔗 USEFUL LINKS

- **DeepSite Repo**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite`
- **HF Spaces Dashboard**: https://huggingface.co/spaces/truegleai
- **Groq Console**: https://console.groq.com
- **HF Inference API Docs**: https://huggingface.co/docs/api-inference
- **llama.cpp Models**: https://huggingface.co/TheBloke
- **DeepSeek Models**: https://huggingface.co/deepseek-ai

---

## 📝 NOTES FOR NEXT CLAUDE INSTANCE

**What you're inheriting**:
- A working router structure (`lib/llm-router.ts`) that's already integrated
- Two HuggingFace Spaces that need optimization
- A clear 4-tier architecture plan
- All credentials and API keys

**What needs to be done**:
- Optimize HF Space models (simple file edits on HuggingFace.co)
- Add Groq tier support to router (TypeScript edits)
- Configure .env.local with all tiers
- Test the complete cascade

**What NOT to do**:
- Don't change the router's core fallback logic (it works)
- Don't modify `app/api/ask/route.ts` beyond the import (already done)
- Don't create new files unless specified in this plan
- Don't overthink - follow the step-by-step instructions

**Expected completion time**: 2-3 hours for all phases

**User preference**: Full control via self-hosted Spaces, cloud only as fallback

---

**END OF HANDOFF DOCUMENT**

*This document contains everything needed to continue the implementation seamlessly. Read it fully before starting work.*

# Comprehensive VM-Based LLM Architecture - Complete Handoff

**Created**: 2026-02-05
**Project**: DeepSite HTML/CSS Generation App
**Architecture**: Privacy-First, Self-Hosted, VM-Based Inference
**Status**: Ready for Implementation

---

## 📋 EXECUTIVE SUMMARY

This document contains everything needed to implement a privacy-first LLM inference system for DeepSite using HuggingFace Spaces as self-hosted infrastructure.

**Core Requirements:**
- ✅ **100% Private** - No cloud APIs with access to sensitive code
- ✅ **Unlimited** - No rate limits or quotas
- ✅ **Self-Hosted** - Complete control on HuggingFace infrastructure
- ⚠️ **Slower but Acceptable** - 2-3 min per request for complete privacy

**Architectural Vision (User's Original Concept):**
1. **Model Storage**: HuggingFace Hub or Space (storage only, no inference)
2. **Inference Engine**: o87LLM-VM Space (downloads model, runs llama.cpp)
3. **Router**: DeepSite app points directly to VM
4. **No Cloud**: No Groq, no OpenAI, no third-party APIs

**Previous Mistakes to Avoid:**
- ❌ Running model IN a Space and proxying to it (current setup)
- ❌ Suggesting cloud APIs despite privacy concerns
- ❌ Not understanding that VM should RUN the model, not proxy to it

---

## 🎯 ARCHITECTURAL CONTEXT

### Why This Architecture?

**Problem 1: Current Setup Times Out**
- deepseek-coder-6b-api runs CodeLlama-7B on cpu-basic (2 vCPUs)
- CPU hits 99-100% during inference
- Takes 90+ seconds, often times out
- User tried switching to DeepSeek-1.3B: still 99% CPU

**Problem 2: Privacy is Non-Negotiable**
- User works on sensitive projects
- Cannot trust cloud APIs (Groq, OpenAI) with proprietary code
- "Working this way to combat the industry, not embolden it"
- Self-hosted is the only acceptable solution

**Problem 3: Misunderstood Architecture**
- Previous Claude instances kept suggesting:
  - Run model in Spaces
  - Use cloud APIs as fallback
  - Proxy setups
- User's vision was always:
  - **Space = Storage** (just host the GGUF file)
  - **VM = Inference** (download and run the model)
  - **No proxying** (single self-contained endpoint)

### Hardware Reality

**HuggingFace cpu-basic Tier (Both Spaces):**
- **vCPUs**: 2 cores
- **RAM**: 16 GB
- **Storage**: 50 GB (non-persistent, resets on restart)
- **Cost**: FREE
- **Hibernation**: Sleeps after 48 hours inactivity

**Performance Expectations:**
- **Model Download**: 30-60 seconds (first startup)
- **Model Loading**: 30-60 seconds (llama.cpp initialization)
- **Inference**: 10-15 tokens/sec on 2 vCPUs
- **Total Response Time**: 2-3 minutes for typical request
- **CPU Usage**: 99-100% during inference (expected and acceptable)

---

## 📊 FINAL ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│  MODEL STORAGE                                               │
│  HuggingFace Model Hub (Public Repository)                  │
│                                                              │
│  Repository: TheBloke/deepseek-coder-1.3b-instruct-GGUF     │
│  File: deepseek-coder-1.3b-instruct.Q4_K_M.gguf             │
│  Size: ~800 MB                                               │
│                                                              │
│  Purpose: Storage only, no inference                         │
└──────────────────────────────────────────────────────────────┘
                             ↓
                 hf_hub_download() on startup
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  INFERENCE ENGINE                                            │
│  o87LLM-VM (HuggingFace Space)                              │
│  URL: https://huggingface.co/spaces/truegleai/o87LLM-VM     │
│                                                              │
│  Hardware: cpu-basic (2 vCPUs + 16GB RAM)                   │
│                                                              │
│  Startup Process:                                            │
│  1. Download GGUF from HF Hub → /tmp/.cache/huggingface     │
│     - First run: ~60 sec download                            │
│     - Cached runs: instant (within 48h)                      │
│                                                              │
│  2. Load model into llama.cpp                                │
│     - n_threads=8 (maximize CPU usage)                       │
│     - n_batch=1024 (optimize throughput)                     │
│     - n_ctx=4096 (context window)                            │
│     - n_gpu_layers=0 (CPU only)                              │
│     - Load time: ~60 sec                                     │
│                                                              │
│  3. Start FastAPI server                                     │
│     - Port: 7860 (HF Spaces default)                         │
│     - Endpoint: /v1/chat/completions (OpenAI-compatible)     │
│     - Health: /health                                        │
│                                                              │
│  Runtime Performance:                                        │
│  - Inference: 10-15 tokens/sec                               │
│  - Typical response: 2-3 minutes                             │
│  - CPU: 99-100% during inference                             │
│  - RAM: ~4-5 GB used                                         │
│                                                              │
│  Cold Start Penalty:                                         │
│  - Space hibernates after 48 hours                           │
│  - First request after wake: +2 min for model load          │
│  - Keep-alive strategy: Make dummy request every 24h        │
└──────────────────────────────────────────────────────────────┘
                             ↓
                      HTTPS Request
                             ↓
┌──────────────────────────────────────────────────────────────┐
│  DEEPSITE APP (Local Development)                           │
│  Location: /Volumes/Duck_Drive/software-dev/git-toolbox/    │
│            deepsite/                                         │
│                                                              │
│  Configuration (.env.local):                                 │
│  - CUSTOM_LLM_BASE_URL=https://truegleai-o87llm-vm.hf.space/v1 │
│  - CUSTOM_LLM_MODEL=deepseek-coder-1.3b-instruct            │
│  - TIER1_TIMEOUT=240000 (4 minutes)                          │
│  - TIER2_ENABLED=false (single tier, no fallback)           │
│                                                              │
│  Router (lib/llm-router.ts):                                 │
│  - Already supports Space tier type                          │
│  - No code changes needed                                    │
│  - Will use single tier (o87LLM-VM)                          │
│                                                              │
│  API Route (app/api/ask/route.ts):                          │
│  - Already imports from router                               │
│  - No code changes needed                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION GUIDE

### PHASE 1: Configure o87LLM-VM as Self-Contained Inference Engine

**Goal**: Transform o87LLM-VM from a proxy to a self-contained inference engine that downloads and runs the model locally.

**Current State**:
- o87LLM-VM currently proxies requests to deepseek-coder-6b-api
- main.py forwards requests to another Space
- We want to eliminate the proxy and run inference directly

**Target State**:
- o87LLM-VM downloads model from HF Hub on startup
- Loads model into llama.cpp
- Serves inference directly via FastAPI
- No external dependencies

---

#### Step 1.1: Update o87LLM-VM Dockerfile

**Location**: https://huggingface.co/spaces/truegleai/o87LLM-VM

**Action**: Create or replace `Dockerfile`

**Content**:
```dockerfile
FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies for llama.cpp compilation
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install llama-cpp-python with OpenBLAS for CPU optimization
# This enables BLAS acceleration for better CPU performance
RUN CMAKE_ARGS="-DGGML_BLAS=ON -DGGML_BLAS_VENDOR=OpenBLAS" \
    FORCE_CMAKE=1 \
    pip install --no-cache-dir --force-reinstall --upgrade --verbose \
    llama-cpp-python==0.2.90

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Expose port 7860 (HuggingFace Spaces default)
EXPOSE 7860

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7860/health || exit 1

# Run the application
CMD ["python", "app.py"]
```

**Why these choices:**
- `python:3.11-slim-bookworm`: Lightweight base image
- `CMAKE_ARGS`: Enables OpenBLAS for ~2x CPU performance boost
- `llama-cpp-python==0.2.90`: Stable version with good CPU support
- Health check: Ensures Space stays healthy

---

#### Step 1.2: Update requirements.txt

**Location**: https://huggingface.co/spaces/truegleai/o87LLM-VM

**Action**: Create or replace `requirements.txt`

**Content**:
```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.0.0
huggingface-hub>=0.19.0
python-multipart
```

**Why these dependencies:**
- `fastapi`: Modern async web framework
- `uvicorn[standard]`: ASGI server with WebSocket support
- `pydantic`: Data validation for API requests
- `huggingface-hub`: Download models from HF Hub
- `python-multipart`: Handle multipart form data

**NOTE**: `llama-cpp-python` is NOT in requirements.txt because it's installed in Dockerfile with special compilation flags.

---

#### Step 1.3: Create New app.py (Complete Self-Contained Inference)

**Location**: https://huggingface.co/spaces/truegleai/o87LLM-VM

**Action**: Replace existing `app.py` or `main.py`

**Content**:
```python
"""
o87LLM-VM Inference Engine
Self-contained LLM inference using llama.cpp
Downloads model from HuggingFace Hub on startup
Serves OpenAI-compatible API via FastAPI
"""

import os
import time
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from llama_cpp import Llama
from huggingface_hub import hf_hub_download

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Model configuration
MODEL_REPO = "TheBloke/deepseek-coder-1.3b-instruct-GGUF"
MODEL_FILE = "deepseek-coder-1.3b-instruct.Q4_K_M.gguf"
MODEL_NAME = "deepseek-coder-1.3b-instruct"

# llama.cpp configuration
MAX_CONTEXT = 4096       # Context window size
N_THREADS = 8            # Use both vCPUs fully
N_BATCH = 1024           # Batch size for prompt processing
N_GPU_LAYERS = 0         # CPU only (no GPU)

# Cache directory (non-persistent on HF Spaces)
CACHE_DIR = "/tmp/.cache/huggingface"

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="o87LLM-VM Inference Engine",
    description="Self-hosted LLM inference using llama.cpp",
    version="1.0.0"
)

# Global model instance (loaded on startup)
llm = None

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class Message(BaseModel):
    """Chat message"""
    role: str  # "system", "user", or "assistant"
    content: str

class ChatRequest(BaseModel):
    """OpenAI-compatible chat request"""
    model: str
    messages: List[Message]
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    stop: Optional[List[str]] = None

class ChatResponse(BaseModel):
    """OpenAI-compatible chat response"""
    id: str
    object: str
    created: int
    model: str
    choices: List[dict]
    usage: dict

# ============================================================================
# STARTUP: DOWNLOAD AND LOAD MODEL
# ============================================================================

@app.on_event("startup")
async def load_model():
    """
    Download model from HuggingFace Hub and load into llama.cpp
    This runs once when the Space starts
    """
    global llm

    logger.info("=" * 60)
    logger.info("STARTING o87LLM-VM INFERENCE ENGINE")
    logger.info("=" * 60)

    try:
        # Step 1: Download model from HuggingFace Hub
        logger.info(f"Downloading model: {MODEL_REPO}/{MODEL_FILE}")
        logger.info(f"Cache directory: {CACHE_DIR}")

        start_time = time.time()
        model_path = hf_hub_download(
            repo_id=MODEL_REPO,
            filename=MODEL_FILE,
            cache_dir=CACHE_DIR,
            resume_download=True  # Resume if interrupted
        )
        download_time = time.time() - start_time

        logger.info(f"✓ Model downloaded in {download_time:.1f}s")
        logger.info(f"✓ Model path: {model_path}")

        # Step 2: Load model into llama.cpp
        logger.info("Loading model into llama.cpp...")
        logger.info(f"Configuration:")
        logger.info(f"  - Context window: {MAX_CONTEXT}")
        logger.info(f"  - Threads: {N_THREADS}")
        logger.info(f"  - Batch size: {N_BATCH}")
        logger.info(f"  - GPU layers: {N_GPU_LAYERS} (CPU only)")

        start_time = time.time()
        llm = Llama(
            model_path=model_path,
            n_ctx=MAX_CONTEXT,
            n_threads=N_THREADS,
            n_batch=N_BATCH,
            verbose=False,
            n_gpu_layers=N_GPU_LAYERS
        )
        load_time = time.time() - start_time

        logger.info(f"✓ Model loaded in {load_time:.1f}s")
        logger.info("=" * 60)
        logger.info("INFERENCE ENGINE READY")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"✗ Error loading model: {e}")
        logger.error("Inference engine will not be available")
        raise

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health():
    """
    Health check endpoint
    Returns 200 if model is loaded, 503 if not
    """
    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded - inference engine unavailable"
        )

    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "ready": True
    }

# ============================================================================
# CHAT COMPLETIONS (OpenAI-compatible API)
# ============================================================================

@app.post("/v1/chat/completions", response_model=ChatResponse)
async def chat_completions(request: ChatRequest):
    """
    OpenAI-compatible chat completions endpoint

    Accepts messages in OpenAI format:
    {
      "model": "deepseek-coder-1.3b-instruct",
      "messages": [
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Write a hello world function"}
      ],
      "max_tokens": 2048,
      "temperature": 0.7
    }

    Returns OpenAI-compatible response
    """
    if llm is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded - inference engine unavailable"
        )

    try:
        # Build prompt from messages
        # Format: ### System: ...\n\n### Instruction: ...\n\n### Response:
        prompt_parts = []

        for msg in request.messages:
            if msg.role == "system":
                prompt_parts.append(f"### System: {msg.content}")
            elif msg.role == "user":
                prompt_parts.append(f"### Instruction: {msg.content}")
            elif msg.role == "assistant":
                prompt_parts.append(f"### Response: {msg.content}")

        # Add final prompt for assistant response
        prompt_parts.append("### Response:")
        prompt = "\n\n".join(prompt_parts)

        # Log inference start
        logger.info(f"Starting inference (max_tokens={request.max_tokens}, temp={request.temperature})")
        start_time = time.time()

        # Generate response using llama.cpp
        response = llm(
            prompt,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            stop=request.stop or ["###"],  # Stop at next section marker
            echo=False  # Don't include prompt in output
        )

        inference_time = time.time() - start_time
        logger.info(f"✓ Inference completed in {inference_time:.1f}s")

        # Format OpenAI-compatible response
        chat_response = ChatResponse(
            id=f"chatcmpl-{int(time.time())}",
            object="chat.completion",
            created=int(time.time()),
            model=MODEL_NAME,
            choices=[{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response["choices"][0]["text"].strip()
                },
                "finish_reason": response["choices"][0]["finish_reason"]
            }],
            usage={
                "prompt_tokens": response["usage"]["prompt_tokens"],
                "completion_tokens": response["usage"]["completion_tokens"],
                "total_tokens": response["usage"]["total_tokens"]
            }
        )

        return chat_response

    except Exception as e:
        logger.error(f"✗ Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with status information"""
    return {
        "service": "o87LLM-VM Inference Engine",
        "model": MODEL_NAME,
        "status": "ready" if llm else "loading",
        "endpoints": {
            "health": "/health",
            "chat": "/v1/chat/completions"
        }
    }

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Run FastAPI server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7860,
        log_level="info"
    )
```

**Key Implementation Details:**

1. **Startup Process** (`load_model`):
   - Downloads model from HF Hub on first startup (~60s)
   - Subsequent starts within 48h use cache (instant)
   - Loads model into llama.cpp (~60s)
   - Total cold start: ~2 minutes

2. **Inference** (`chat_completions`):
   - Accepts OpenAI-compatible format
   - Converts messages to DeepSeek prompt format
   - Runs llama.cpp inference
   - Returns OpenAI-compatible response

3. **Performance Optimization**:
   - `n_threads=8`: Uses both vCPUs fully
   - `n_batch=1024`: Optimizes prompt processing
   - `stop=["###"]`: Prevents model from continuing past response

4. **Error Handling**:
   - Returns 503 if model not loaded
   - Logs all operations for debugging
   - Proper exception handling

---

#### Step 1.4: Update README.md Metadata

**Location**: https://huggingface.co/spaces/truegleai/o87LLM-VM

**Action**: Add to the top of `README.md` (before any other content)

**Content**:
```yaml
---
title: o87LLM-VM Inference Engine
emoji: 🚀
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: apache-2.0
startup_duration_timeout: 30m
---

# o87LLM-VM Inference Engine

Self-hosted LLM inference using llama.cpp on HuggingFace Spaces.

**Model**: DeepSeek-Coder-1.3B-Instruct (Q4_K_M)
**Hardware**: cpu-basic (2 vCPUs + 16GB RAM)
**API**: OpenAI-compatible `/v1/chat/completions`

## Endpoints

- `GET /health` - Health check
- `POST /v1/chat/completions` - Chat completions (OpenAI format)
- `GET /` - Service information
```

**Why this metadata:**
- `sdk: docker`: Tells HF to use Docker (not Gradio/Streamlit)
- `app_port: 7860`: HF Spaces default port
- `startup_duration_timeout: 30m`: Allow time for model download

---

#### Step 1.5: Commit and Deploy

**Steps**:
1. Go to https://huggingface.co/spaces/truegleai/o87LLM-VM
2. Click "Files" tab
3. Upload or edit:
   - `Dockerfile`
   - `requirements.txt`
   - `app.py`
   - `README.md`
4. Commit all changes with message: "Convert to self-contained inference engine"
5. Space will automatically rebuild (3-5 minutes)

**Monitoring the Build**:
- Watch the "Logs" tab on the Space
- Look for:
  ```
  Downloading model: TheBloke/deepseek-coder-1.3b-instruct-GGUF
  ✓ Model downloaded in 45.2s
  Loading model into llama.cpp...
  ✓ Model loaded in 52.1s
  INFERENCE ENGINE READY
  ```

**Troubleshooting**:
- If build fails: Check Dockerfile syntax
- If model download fails: Check MODEL_REPO name
- If llama.cpp fails: Check llama-cpp-python installation logs

---

#### Step 1.6: Test the Inference Engine

Once the Space shows "Running" status, test it:

**Test 1: Health Check**
```bash
curl https://truegleai-o87llm-vm.hf.space/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "model": "deepseek-coder-1.3b-instruct",
  "ready": true
}
```

**Test 2: Simple Inference**
```bash
curl -X POST "https://truegleai-o87llm-vm.hf.space/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-coder-1.3b-instruct",
    "messages": [
      {"role": "user", "content": "Write a Python hello world function"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

**Expected Response** (after 2-3 minutes):
```json
{
  "id": "chatcmpl-1738443899",
  "object": "chat.completion",
  "created": 1738443899,
  "model": "deepseek-coder-1.3b-instruct",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "def hello_world():\n    print('Hello, World!')\n\nhello_world()"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 25,
    "total_tokens": 40
  }
}
```

**Performance Expectations**:
- **First request after startup**: 2-3 minutes (model already loaded)
- **Subsequent requests**: 2-3 minutes each (CPU-bound inference)
- **After 48h hibernation**: +2 minutes for model reload

---

### PHASE 2: Configure DeepSite to Use o87LLM-VM

**Goal**: Point DeepSite app to the new o87LLM-VM inference engine

---

#### Step 2.1: Update .env.local

**Location**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/.env.local`

**Action**: Replace entire file content

**Content**:
```env
# ============================================================================
# DEEPSITE ENVIRONMENT CONFIGURATION
# Privacy-First VM-Based Architecture
# ============================================================================

# HuggingFace Token (for any HF API operations)
HF_TOKEN=hf_YOUR_TOKEN_HERE

# ============================================================================
# TIER 1: o87LLM-VM (Self-Hosted Inference Engine)
# ============================================================================
# This is our ONLY tier - no fallback needed
# VM downloads model from HF Hub and runs inference locally
# Performance: 2-3 min per request (CPU-bound, acceptable for privacy)

CUSTOM_LLM_API_KEY=optional
CUSTOM_LLM_BASE_URL=https://truegleai-o87llm-vm.hf.space/v1
CUSTOM_LLM_MODEL=deepseek-coder-1.3b-instruct
TIER1_TIMEOUT=240000  # 4 minutes (accommodate CPU inference + cold starts)

# ============================================================================
# DISABLE OTHER TIERS (Privacy-First: No Fallback Needed)
# ============================================================================
# We don't want any fallback to cloud APIs
# Single self-hosted tier is sufficient

TIER2_ENABLED=false
TIER3_ENABLED=false
TIER4_ENABLED=false

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
# Using SQLite (local) - no MongoDB needed

# ============================================================================
# API CONFIGURATION
# ============================================================================
NEXT_APP_API_URL=http://localhost:3000/api
```

**Why these settings:**
- `CUSTOM_LLM_BASE_URL`: Points to o87LLM-VM `/v1` endpoint
- `TIER1_TIMEOUT=240000`: 4 minutes to accommodate:
  - Cold start: +2 min (if Space hibernated)
  - Inference: 2-3 min (CPU-bound)
- `TIER2_ENABLED=false`: No fallback (privacy-first)

---

#### Step 2.2: Verify Router Configuration

**Location**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/lib/llm-router.ts`

**Action**: NO CHANGES NEEDED

**Why**: The existing router already supports:
- Space tier type
- Single tier operation
- Proper timeout handling
- OpenAI-compatible API calls

The router will:
1. Read CUSTOM_LLM_* from .env.local
2. Build single tier (Tier 1 = o87LLM-VM)
3. Make POST to `/v1/chat/completions`
4. Wait up to 4 minutes (TIER1_TIMEOUT)
5. Return response or throw error

---

#### Step 2.3: Verify API Route

**Location**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/app/api/ask/route.ts`

**Action**: NO CHANGES NEEDED

**Why**: Already imports and uses `generateWithLLM` from router

**Note**: There's a validation at lines 45-49 that checks for CUSTOM_LLM_API_KEY and CUSTOM_LLM_BASE_URL. This is OK - we have both configured.

---

#### Step 2.4: Test in DeepSite App

**Steps**:
1. Clean Next.js cache:
   ```bash
   cd /Volumes/Duck_Drive/software-dev/git-toolbox/deepsite
   rm -rf .next
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open browser: http://localhost:3000

4. Make a request (e.g., "Create a landing page for a coffee shop")

5. Watch terminal logs

**Expected Logs**:
```
→ Trying: Tier 1: Your HF Space
[Wait 2-3 minutes]
✓ Success: Tier 1: Your HF Space (165000ms, total: 165000ms)
```

**Success Criteria**:
- ✅ Request completes without timeout
- ✅ Response time: 2-4 minutes
- ✅ HTML/CSS generated successfully
- ✅ No errors in terminal
- ✅ No attempts to call cloud APIs

---

### PHASE 3: Performance Optimization (Optional)

If 2-3 minutes is too slow, try these optimizations:

---

#### Option A: Use Smaller Model

**Trade-off**: Faster inference, lower quality output

**Step 1**: Edit o87LLM-VM `app.py` configuration:

```python
# Option 1: TinyLlama 1.1B (1 min responses, basic quality)
MODEL_REPO = "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF"
MODEL_FILE = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
MODEL_NAME = "tinyllama-1.1b-chat"

# Option 2: Qwen 500M (30-45s responses, lower quality)
MODEL_REPO = "Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF"
MODEL_FILE = "qwen2.5-coder-0.5b-instruct-q4_k_m.gguf"
MODEL_NAME = "qwen2.5-coder-0.5b"
```

**Step 2**: Commit and wait for rebuild

**Step 3**: Test - should see faster responses

---

#### Option B: Reduce Max Tokens

**Trade-off**: Faster but shorter responses

**Location**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/app/api/ask/route.ts`

**Change lines 87 and 226**:
```typescript
// FROM:
maxTokens: 2048,

// TO:
maxTokens: 1024,  // Half the tokens = ~half the time
```

---

#### Option C: Adjust Temperature

**Trade-off**: Lower temperature = more focused, slightly faster

**Location**: Same as Option B

**Change lines 88 and 227**:
```typescript
// FROM:
temperature: 0.7

// TO:
temperature: 0.5  // More deterministic, slightly faster
```

---

#### Option D: Increase CPU Threads (If Available)

**Note**: This only helps if Space has more than 2 vCPUs (unlikely on cpu-basic)

**Location**: o87LLM-VM `app.py`

```python
# Try increasing to see if there are more cores available
N_THREADS = 16  # llama.cpp will use what's available
```

---

## 🔄 ADVANCED: LOAD BALANCING SETUP (Optional)

**When Useful**: If you have multiple concurrent users or parallel requests

### Concept

```
                    ┌─→ o87LLM-VM-1 (2-3 min) ─┐
Request → Router ───┼─→ o87LLM-VM-2 (2-3 min) ─┼─→ Response
                    └─→ o87LLM-VM-3 (2-3 min) ─┘
```

**Benefit**: Handle 3x concurrent requests
**Limitation**: Individual request still takes 2-3 min
**Cost**: Need 3 HF accounts (or 3 Spaces on one account)

### Implementation

**Step 1**: Clone o87LLM-VM to 3 Spaces
- Space 1: `truegleai/o87llm-vm-1`
- Space 2: `truegleai/o87llm-vm-2`
- Space 3: `truegleai/o87llm-vm-3`

**Step 2**: Update `lib/llm-router.ts` to add load balancing:

```typescript
// Add round-robin load balancing
const VM_URLS = [
  'https://truegleai-o87llm-vm-1.hf.space/v1',
  'https://truegleai-o87llm-vm-2.hf.space/v1',
  'https://truegleai-o87llm-vm-3.hf.space/v1'
];

let currentVMIndex = 0;

function getNextVMUrl(): string {
  const url = VM_URLS[currentVMIndex];
  currentVMIndex = (currentVMIndex + 1) % VM_URLS.length;
  return url;
}

// In buildTierConfig(), use getNextVMUrl() for CUSTOM_LLM_BASE_URL
```

**Step 3**: Test with multiple parallel requests

**Result**: 3 parallel requests complete in ~2-3 min (vs 6-9 min sequentially)

---

## 📋 COMPLETE FILE CHECKLIST

### Files to Create/Modify on HuggingFace

**Space**: https://huggingface.co/spaces/truegleai/o87LLM-VM

- [ ] `Dockerfile` - Complete replacement
- [ ] `requirements.txt` - Complete replacement
- [ ] `app.py` - Complete replacement (delete `main.py` if exists)
- [ ] `README.md` - Add metadata to top

### Files to Modify Locally

**Project**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/`

- [ ] `.env.local` - Complete replacement
- [ ] `lib/llm-router.ts` - NO CHANGES NEEDED
- [ ] `app/api/ask/route.ts` - NO CHANGES NEEDED

---

## ✅ SUCCESS CRITERIA

**After implementation, verify:**

### Infrastructure
- [ ] o87LLM-VM Space shows "Running" status
- [ ] Space logs show "INFERENCE ENGINE READY"
- [ ] Health endpoint returns 200 OK
- [ ] No proxy code remaining in o87LLM-VM

### Functionality
- [ ] Curl test returns valid response in 2-3 minutes
- [ ] DeepSite app generates HTML/CSS successfully
- [ ] Router logs show "✓ Success: Tier 1"
- [ ] No timeout errors in terminal

### Privacy
- [ ] No requests to Groq, OpenAI, or other cloud APIs
- [ ] All inference happens on your HuggingFace Space
- [ ] Sensitive code never leaves your infrastructure

### Performance
- [ ] Response time: 2-4 minutes (acceptable)
- [ ] CPU usage: 99-100% during inference (expected)
- [ ] RAM usage: ~4-5 GB (comfortable within 16GB)
- [ ] No memory errors or OOM kills

---

## 🚨 TROUBLESHOOTING GUIDE

### Issue 1: Space Won't Start

**Symptoms**: Build fails, Space shows "Build error"

**Possible Causes**:
1. Syntax error in Dockerfile
2. Invalid model repository name
3. Network issue downloading model

**Solutions**:
- Check Space logs for exact error
- Verify MODEL_REPO exists: https://huggingface.co/TheBloke/deepseek-coder-1.3b-instruct-GGUF
- Try rebuilding (sometimes HF Hub has temporary issues)
- Check Dockerfile COPY commands match actual file names

---

### Issue 2: Model Download Fails

**Symptoms**: Logs show "Error loading model" or "Connection timeout"

**Possible Causes**:
1. Model repo doesn't exist
2. Model file name wrong
3. Network timeout (large model)
4. Rate limiting from HF Hub

**Solutions**:
- Verify exact file name on HF Hub repo
- Check if file is actually a GGUF (not GGML)
- Try smaller model first (TinyLlama 1.1B)
- Wait and retry (rate limits reset)

---

### Issue 3: llama.cpp Initialization Fails

**Symptoms**: "Model loaded" but crashes on first inference

**Possible Causes**:
1. Not enough RAM (16GB should be fine for 1.3B Q4)
2. Corrupted model download
3. llama-cpp-python version mismatch

**Solutions**:
- Check RAM usage in Space logs
- Clear cache and redownload: change `CACHE_DIR`
- Try different llama-cpp-python version
- Use smaller quantization (Q3 instead of Q4)

---

### Issue 4: DeepSite Timeout

**Symptoms**: "✗ Failed: Tier 1 (240000ms) - Timeout"

**Possible Causes**:
1. Space hibernated (cold start)
2. Request takes longer than 4 minutes
3. Network issue between local ↔ HF Space

**Solutions**:
- Make warm-up request first: `curl .../health`
- Increase timeout in .env.local: `TIER1_TIMEOUT=360000` (6 min)
- Check Space logs - is inference actually completing?
- Reduce max_tokens for faster inference

---

### Issue 5: Slow Inference (>5 min)

**Symptoms**: Responses take 5-10 minutes

**Possible Causes**:
1. Model too large for 2 vCPUs
2. Not using OpenBLAS optimization
3. Too many tokens requested
4. Multiple concurrent requests

**Solutions**:
- Switch to smaller model (TinyLlama 1.1B)
- Verify Dockerfile has CMAKE_ARGS for OpenBLAS
- Reduce max_tokens: 1024 instead of 2048
- Implement load balancing if concurrent usage

---

### Issue 6: Poor Quality Output

**Symptoms**: Generated code is wrong or nonsensical

**Possible Causes**:
1. Model too small (over-optimized for speed)
2. Temperature too high/low
3. Context window insufficient
4. Prompt format wrong

**Solutions**:
- Use larger model: DeepSeek-1.3B instead of TinyLlama
- Adjust temperature: 0.7 is balanced
- Increase n_ctx if prompts are very long
- Check prompt format matches DeepSeek training

---

### Issue 7: Space Keeps Hibernating

**Symptoms**: First request always slow (cold start)

**Possible Causes**:
- HF Spaces hibernate after 48h inactivity
- This is normal behavior on free tier

**Solutions**:
- **Option A**: Make dummy request every 24h (cron job)
  ```bash
  # Add to crontab
  0 */12 * * * curl https://truegleai-o87llm-vm.hf.space/health
  ```

- **Option B**: Upgrade to persistent hardware (costs money)

- **Option C**: Accept cold start penalty (user expectation)

---

### Issue 8: API Format Mismatch

**Symptoms**: DeepSite gets errors parsing response

**Possible Causes**:
1. Response not OpenAI-compatible
2. Missing fields in ChatResponse
3. Wrong content type

**Solutions**:
- Test with curl first to verify response format
- Check app.py ChatResponse model matches OpenAI spec
- Verify Content-Type: application/json header

---

## 🔑 CRITICAL INFORMATION REFERENCE

### API Keys & Tokens

| Service | Credential | Location |
|---------|------------|----------|
| HuggingFace | `hf_YOUR_TOKEN_HERE` | `.env.local` (HF_TOKEN) |
| o87LLM-VM | No auth needed (public Space) | - |

### URLs

| Component | URL |
|-----------|-----|
| o87LLM-VM Space | https://huggingface.co/spaces/truegleai/o87LLM-VM |
| o87LLM-VM API | https://truegleai-o87llm-vm.hf.space |
| Model Repository | https://huggingface.co/TheBloke/deepseek-coder-1.3b-instruct-GGUF |
| DeepSite Local | http://localhost:3000 |

### File Paths

| File | Full Path |
|------|-----------|
| DeepSite .env.local | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/.env.local` |
| Router | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/lib/llm-router.ts` |
| API Route | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/app/api/ask/route.ts` |
| Plan File | `/Users/ducke.duck_1/.claude/plans/drifting-scribbling-origami.md` |
| This Handoff | `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/COMPREHENSIVE_VM_ARCHITECTURE_HANDOFF.md` |

### Performance Benchmarks

| Metric | Expected Value |
|--------|----------------|
| Model Download (first time) | 30-60 seconds |
| Model Loading | 30-60 seconds |
| Cold Start (total) | 1-2 minutes |
| Inference (2048 tokens) | 2-3 minutes |
| Tokens/Second | 10-15 |
| CPU Usage | 99-100% |
| RAM Usage | 4-5 GB |
| Timeout Setting | 240,000ms (4 min) |

---

## 📖 CONCEPTUAL UNDERSTANDING

### Why This Works

**Storage vs Compute Separation**:
- **HF Hub**: Stores GGUF files (model weights)
- **o87LLM-VM**: Downloads weights, runs inference
- **Benefit**: Clean separation, can swap models easily

**llama.cpp on CPU**:
- Optimized C++ inference engine
- GGUF format designed for CPU efficiency
- Quantization (Q4_K_M) reduces memory and computation
- OpenBLAS acceleration leverages CPU SIMD instructions

**Why 2-3 Minutes**:
- Model has ~1.3B parameters
- CPU can process ~10-15 tokens/sec
- 2048 max_tokens ÷ 10 tokens/sec = ~200 seconds
- Plus prompt processing + overhead = 2-3 minutes

### Why Previous Approaches Failed

**Approach 1**: Run CodeLlama-7B in Space
- ❌ 7B too large for 2 vCPUs
- ❌ 90+ second timeout

**Approach 2**: Switch to DeepSeek-1.3B in Space
- ⚠️ Better but still slow (2-3 min)
- ❌ CPU still at 99%
- User accepted this as "working"

**Approach 3**: Use Groq Cloud API
- ❌ Violates privacy requirement
- ❌ User doesn't trust cloud with sensitive code

**Final Approach**: Run in o87LLM-VM
- ✅ Same hardware as before (2 vCPUs)
- ✅ But cleaner architecture (VM runs model)
- ✅ Respects privacy (no cloud)
- ✅ User accepts 2-3 min for privacy

**Key Insight**: Performance is the same whether you run in:
- deepseek-coder-6b-api Space
- o87LLM-VM Space

Because both have identical hardware (cpu-basic). The benefit of o87LLM-VM approach is architectural clarity and matching user's original vision.

---

## 🎯 IMPLEMENTATION PRIORITIES

If time is limited, implement in this order:

### Priority 1: CRITICAL (Must Have)
1. Update o87LLM-VM (Dockerfile, requirements, app.py)
2. Test with curl
3. Update DeepSite .env.local
4. Test in DeepSite app

**Outcome**: Working privacy-first inference

### Priority 2: HIGH (Should Have)
1. Add comprehensive logging to app.py
2. Implement health checks
3. Test cold start behavior
4. Document performance expectations

**Outcome**: Production-ready reliability

### Priority 3: MEDIUM (Nice to Have)
1. Optimize model size (try TinyLlama)
2. Tune llama.cpp parameters
3. Implement keep-alive strategy
4. Add monitoring/alerting

**Outcome**: Better performance and uptime

### Priority 4: LOW (Future Enhancement)
1. Load balancing across multiple VMs
2. GPU upgrade path
3. Model switching capability
4. Advanced caching strategies

**Outcome**: Scalability options

---

## 🚀 NEXT STEPS FOR IMPLEMENTER

**If you're the next Claude instance (or the user) implementing this:**

1. **Read this entire document** (yes, all of it - it's comprehensive for a reason)

2. **Understand the context**:
   - User values privacy above speed
   - Previous plans misunderstood the architecture
   - VM should run model, not proxy to it

3. **Start with Phase 1**:
   - Focus on getting o87LLM-VM working
   - Test thoroughly with curl before moving to Phase 2

4. **Don't skip testing**:
   - Each phase has explicit test steps
   - Verify success criteria before proceeding

5. **Accept the performance**:
   - 2-3 minutes per request is expected
   - CPU at 99% is normal
   - This is the trade-off for privacy

6. **Ask questions if unclear**:
   - Better to clarify than implement wrong
   - User has been through this multiple times
   - They know what they want

7. **Document progress**:
   - Update handoff with any discoveries
   - Note any deviations from plan
   - Record actual performance metrics

---

## 📝 QUESTIONS FOR USER (If Needed)

**Before Implementation**:
- [ ] Confirm o87LLM-VM is the correct Space to modify
- [ ] Verify you have access to edit the Space
- [ ] Confirm 2-3 min response time is acceptable
- [ ] Any other Spaces we should be aware of?

**During Implementation**:
- [ ] Should we delete deepseek-coder-6b-api Space? (no longer needed)
- [ ] Want to implement load balancing (multiple VMs)?
- [ ] Prefer smaller/faster model over quality?
- [ ] Need help with keep-alive strategy?

**After Implementation**:
- [ ] Performance meeting expectations?
- [ ] Any quality issues with output?
- [ ] Want to optimize further?
- [ ] Ready for production use?

---

## 🏁 CONCLUSION

This architecture implements exactly what the user originally envisioned:

1. **Storage**: Model hosted on HF Hub (or Space)
2. **Inference**: o87LLM-VM downloads and runs model
3. **Privacy**: No cloud APIs, completely self-hosted
4. **Performance**: Slower but acceptable trade-off

**Key Success Factors**:
- ✅ Respects user's privacy requirements
- ✅ Implements their original architectural vision
- ✅ Uses free infrastructure (HuggingFace Spaces)
- ✅ Complete control over model and code
- ✅ Unlimited requests (no rate limits)

**Expected Outcome**:
- Working LLM inference in 2-3 minutes per request
- 100% private and self-hosted
- User can continue development without cloud dependencies
- Foundation for future optimizations (GPU, load balancing, etc.)

---

**END OF COMPREHENSIVE HANDOFF DOCUMENT**

*This document contains everything needed to implement the privacy-first VM-based LLM architecture. Read fully before starting implementation. Good luck!* 🚀

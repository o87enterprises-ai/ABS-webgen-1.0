# DeepSite Setup & Integration Guide

## Quick Start - Get AI Working

### Step 1: Get Your Hugging Face Token
1. Visit: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name: `deepsite-local`
4. Type: Select "Read" permissions
5. Click "Generate"
6. Copy the token (starts with `hf_`)

### Step 2: Configure Environment
1. Open `.env.local` in this directory
2. Replace `YOUR_HUGGING_FACE_TOKEN_HERE` with your actual token
3. Save the file

Example:
```bash
HF_TOKEN=hf_abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 3: Start DeepSite
```bash
npm run dev
```

### Step 4: Test AI Generation
1. Open http://localhost:3000/new
2. Enter a prompt: "Create a simple landing page with a hero section"
3. Watch the AI generate HTML/CSS/JavaScript code in real-time

---

## Architecture Overview

### How AI Code Generation Works

**Flow:**
```
User Prompt → Next.js API Route → Hugging Face Inference API → AI Model → Streaming Response → Live Preview
```

**Key Components:**
- **Frontend**: Monaco Editor (VS Code's editor) + React
- **Backend**: Next.js API Routes (`app/api/ask/route.ts`)
- **AI Client**: `@huggingface/inference` package
- **Models**: DeepSeek V3, Qwen3-Coder-480B, Kimi-K2, etc.

### Supported AI Models
1. **DeepSeek V3** - Fast, good for general web development
2. **DeepSeek V3.1** - Enhanced version
3. **DeepSeek V3.2 Exp** - Experimental, cutting edge
4. **Qwen3-Coder-480B** - Specialized for coding tasks
5. **Kimi-K2-Instruct** - Creative designs
6. **GLM-4.6** - Alternative option

### Provider Auto-Selection
DeepSite automatically selects the best provider based on:
- Provider status (live/offline)
- Pricing (cost per token)
- Availability

Supported providers: Fireworks AI, Nebius, SambaNova, NovitaAI, Hyperbolic, Together AI, Groq

---

## Third-Party API Integration

### Current Limitation
DeepSite is **hardcoded to Hugging Face Inference API**. It cannot directly use:
- OpenAI API
- Anthropic (Claude) API
- Local LLMs (Ollama, LM Studio)
- Custom API endpoints

### Option A: Use Hugging Face Providers (Recommended)
The easiest path - Hugging Face routes to multiple providers:
- **Groq** - Very fast inference
- **Together AI** - Good model selection
- **Fireworks AI** - Reliable performance

You only need one HF token, and it works with all providers.

### Option B: Modify for Custom APIs (Advanced)
To use non-HF APIs, modify these files:

**1. Replace Inference Client** (`app/api/ask/route.ts:116`)
```typescript
// Current:
const client = new InferenceClient(token);

// Replace with custom API:
const response = await fetch('https://api.your-provider.com/chat', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ model: 'your-model', messages: [...] })
});
```

**2. Update Provider Configuration** (`lib/providers.ts`)
Add your custom provider to the `PROVIDERS` object.

**3. Modify Token Configuration** (`app/api/ask/route.ts:67-89`)
Change environment variable names and authentication logic.

---

## MCP (Model Context Protocol) Integration

### Current Status
❌ DeepSite does **NOT** support MCP

### What is MCP?
Model Context Protocol - a standard for connecting AI assistants to external tools and data sources. Used by:
- Claude Desktop
- VS Code extensions
- Custom AI agents

### Option 1: Extract Prompts for MCP Server

DeepSite's **real value is its prompt engineering**. You can extract the prompts:

**Extract from:** `lib/prompts.ts`

**Use in your MCP server:**
```typescript
// DeepSite's system prompt
export const DEEPSITE_SYSTEM_PROMPT = `You are an expert UI/UX and Front-End Developer.
You create websites in a way a designer would, using ONLY HTML, CSS and Javascript.
Try to create the best UI possible. Important: Make the website responsive by using TailwindCSS...
[etc - see lib/prompts.ts lines 23-69]
`;

// Use in your MCP tool
async function generateWebsite(prompt: string) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    system: DEEPSITE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }]
  });
  return response.content;
}
```

### Option 2: Create DeepSite MCP Server

**Goal:** Make DeepSite functionality available via MCP

**Approach:**
1. Create MCP server package
2. Expose DeepSite's prompt templates
3. Use with Claude Desktop or Qwen Code

**Implementation Outline:**
```typescript
// mcp-deepsite-server.ts
import { Server } from "@modelcontextprotocol/sdk/server";
import { INITIAL_SYSTEM_PROMPT, FOLLOW_UP_SYSTEM_PROMPT } from "./lib/prompts";

const server = new Server({
  name: "deepsite",
  version: "1.0.0"
});

server.tool("generate-website", async ({ prompt }) => {
  // Use prompt with your preferred LLM
  // Return generated HTML
});
```

---

## Plugin/Extension Options

### Q: Can DeepSite run as a VS Code extension?
**A:** Not currently, but possible with refactoring.

**Required Changes:**
1. Replace Next.js API routes with VS Code extension API
2. Port Monaco editor integration (already uses Monaco)
3. Replace iframe preview with VS Code webview
4. Store files in workspace instead of Hugging Face repos

**Effort Level:** 🔨🔨🔨 High (2-3 weeks of development)

### Q: Can DeepSite run inside Claude Desktop?
**A:** Limited options:

**Option 1:** Web View (Simple)
- Run DeepSite on localhost:3000
- Open in Claude Desktop's browser
- Limitation: Not native integration

**Option 2:** MCP Integration (Better)
- Extract prompt templates
- Create MCP server that uses DeepSite's prompts
- Call from Claude Desktop
- Limitation: No UI, just prompt-to-code

**Option 3:** Custom Desktop App (Complex)
- Rewrite as Electron app
- Embed Claude API instead of HF API
- Full native experience
- Effort Level: 🔨🔨🔨🔨 Very High (1-2 months)

### Q: Can DeepSite work with Qwen Code?
**A:** Same as Claude Desktop - web view or MCP server approach.

---

## Recommended Integration Path

### For Local Development (Now)
✅ **Use DeepSite as standalone web app**
- Fast setup (just add HF token)
- No modifications needed
- Full feature set

### For MCP Integration (Future)
✅ **Extract prompts, use your own LLM**
- Copy `lib/prompts.ts` system prompts
- Use with Claude API, OpenAI, or local models
- Build custom MCP server
- See extraction guide below

### For Plugin Development (Advanced)
⚠️ **Consider effort vs. benefit**
- VS Code: High effort, but doable
- Claude Desktop: Very high effort
- Alternative: Just use DeepSite web app + your IDE side-by-side

---

## Extracting DeepSite's Prompt Engineering

### What Makes DeepSite Special

The AI models are standard (DeepSeek, Qwen, etc.), but DeepSite's **prompt engineering** is valuable:

1. **System Prompt Structure** - Tells AI to use TailwindCSS, specific libraries
2. **Output Format** - Special tags for multi-page apps
3. **Update Format** - SEARCH/REPLACE pattern for code edits

### Key Files to Extract

**1. Initial Generation Prompt** (`lib/prompts.ts:23-69`)
```typescript
export const INITIAL_SYSTEM_PROMPT = `You are an expert UI/UX and Front-End Developer...`
```
This makes the AI generate complete HTML pages with TailwindCSS.

**2. Follow-up Edit Prompt** (`lib/prompts.ts:71-151`)
```typescript
export const FOLLOW_UP_SYSTEM_PROMPT = `You are modifying an existing HTML file...`
```
This makes the AI update code using SEARCH/REPLACE blocks.

**3. Special Tags** (`lib/prompts.ts:1-14`)
```typescript
export const SEARCH_START = "<<<<<<< SEARCH";
export const DIVIDER = "=======";
export const REPLACE_END = ">>>>>>> REPLACE";
// etc...
```
These structure the AI's output for parsing.

### Usage Example

**Standalone Script Using DeepSite Prompts:**
```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateWebsite(userPrompt: string) {
  const systemPrompt = `You are an expert UI/UX and Front-End Developer.
  You create websites using ONLY HTML, CSS and Javascript.
  Make it responsive with TailwindCSS...
  [include full INITIAL_SYSTEM_PROMPT from DeepSite]
  `;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return message.content[0].text;
}

// Use it
const html = await generateWebsite("Create a landing page for a SaaS product");
console.log(html);
```

---

## Quick Reference

### Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `HF_TOKEN` | ✅ Yes | Hugging Face API authentication |
| `DEFAULT_HF_TOKEN` | ❌ No | Fallback for public access |
| `MONGODB_URI` | ❌ No | Save projects to database |

### Important Files
| File | Purpose |
|------|---------|
| `app/api/ask/route.ts` | Main AI endpoint (POST for new, PUT for edits) |
| `lib/prompts.ts` | System prompts (the magic sauce) |
| `lib/providers.ts` | AI model configurations |
| `lib/best-provider.ts` | Auto-select optimal provider |
| `components/editor/` | Monaco editor integration |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ask` | POST | Generate new website from prompt |
| `/api/ask` | PUT | Update existing website |
| `/api/re-design` | PUT | Convert existing site to DeepSite format |

### Commands
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm start            # Run production build
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
```

---

## Troubleshooting

### AI Not Responding
1. Check `.env.local` has valid HF token
2. Restart dev server: `npm run dev`
3. Check browser console for errors
4. Verify token at https://huggingface.co/settings/tokens

### "No content returned from the model"
- Model might be offline
- Try different model (DeepSeek V3 → Qwen3-Coder)
- Check provider status in browser console

### Rate Limits
- Without HF token: 4 requests per IP
- With HF token: Much higher limits
- Consider HF Pro for unlimited requests

### Port 3000 Already in Use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## Next Steps

1. ✅ **Get HF token** - https://huggingface.co/settings/tokens
2. ✅ **Add to `.env.local`** - Replace placeholder
3. ✅ **Start server** - `npm run dev`
4. ✅ **Test generation** - http://localhost:3000/new
5. 📊 **Decide integration path:**
   - Use as standalone web app? → Done!
   - Want MCP integration? → Extract prompts from `lib/prompts.ts`
   - Want plugin? → Consider effort vs. benefit

---

## Resources

- **HF Token**: https://huggingface.co/settings/tokens
- **DeepSite Space**: https://huggingface.co/spaces/AnkhLP--deepsite
- **Supported Models**: See README.md
- **System Prompts**: See `lib/prompts.ts`
- **MCP Docs**: https://modelcontextprotocol.io

---

**Status:** ✅ Environment configured, ready for HF token

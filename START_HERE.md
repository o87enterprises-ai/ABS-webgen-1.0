# 🚀 DeepSite - Start Here

**Status**: ✅ Configured and ready for your Hugging Face token

---

## ⚡ Quick Start (5 minutes)

### Step 1: Get Hugging Face Token
1. Go to: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name: `deepsite-local`
4. Permissions: **"Read"** (default is fine)
5. Click **"Generate"**
6. **Copy the token** (starts with `hf_`)

### Step 2: Add Token to Environment
1. Open `.env.local` in this directory
2. Replace `YOUR_HUGGING_FACE_TOKEN_HERE` with your actual token
3. Save the file

Should look like:
```
HF_TOKEN=hf_abcdefghijklmnopqrstuvwxyz1234567890
```

### Step 3: Start DeepSite
```bash
npm run dev
```

Wait ~15-30 seconds for startup.

### Step 4: Generate Your First Website
1. Open: http://localhost:3000/new
2. Enter a prompt like:
   - "Create a landing page for a coffee shop"
   - "Create a portfolio website for a photographer"
   - "Create a todo list app with local storage"
3. Watch the AI generate complete HTML/CSS/JavaScript in real-time!
4. Preview updates live in the iframe
5. Iterate with follow-up prompts to refine

**That's it!** 🎉

---

## 📚 Documentation Overview

I've created comprehensive documentation for you:

### 1. **QUICKSTART.md** - Already exists
- System requirements
- Installation guide
- Project structure
- Technologies used
- Troubleshooting

### 2. **SETUP_GUIDE.md** ⭐ Start here for details
- Complete setup walkthrough
- Architecture explanation
- Third-party API integration options
- MCP (Model Context Protocol) integration
- Plugin development possibilities
- Prompt extraction guide

### 3. **INTEGRATION_EXAMPLES.md** ⭐ For advanced use
- MCP server for Claude Desktop
- Standalone scripts with Anthropic API
- OpenAI API integration
- Local LLM (Ollama) integration
- Complete working code examples

### 4. **extract-prompts.js** - Utility script
- Extracts DeepSite's valuable prompt engineering
- Outputs JSON and Markdown files
- Use these prompts in your own projects

---

## 🎯 What I Diagnosed

### The Problem
**AI was not functioning** because:
- Missing `.env.local` file with Hugging Face API token
- No authentication configured

### The Solution
I've created `.env.local` with a placeholder. Just add your token and you're good to go!

---

## 🔍 Key Findings

### How DeepSite Works
- **Input**: Natural language prompt ("Create a landing page...")
- **Processing**: Sends to Hugging Face Inference API with detailed system prompts
- **AI Models**: DeepSeek V3, Qwen3-Coder-480B, Kimi-K2, etc.
- **Output**: Complete HTML/CSS/JavaScript code using TailwindCSS
- **Preview**: Real-time rendering in Monaco editor + iframe

### What Makes It Special
The **prompt engineering** is the secret sauce:
- System prompts that guide AI to generate clean, responsive code
- Structured output format with special tags for multi-page apps
- SEARCH/REPLACE pattern for iterative edits
- Best practices baked in (TailwindCSS, CDN links, responsive design)

---

## 🔌 Integration Possibilities

### ✅ Can Do (Easy)
1. **Use as standalone web app** - Just add HF token (done!)
2. **Extract prompts for other AI systems** - See `extract-prompts.js`
3. **Use with Hugging Face providers** - Groq, Together AI, Fireworks AI, etc.

### ⚠️ Can Do (Moderate Effort)
1. **Create MCP server** - Expose DeepSite functionality to Claude Desktop
2. **Use prompts with other APIs** - Anthropic, OpenAI, local LLMs
3. **Build custom integrations** - See INTEGRATION_EXAMPLES.md

### ❌ Cannot Do (Without Heavy Refactoring)
1. **Direct MCP support** - Not built into DeepSite
2. **VS Code extension** - Would need to port to extension API
3. **Claude Desktop plugin** - Would need Electron rewrite
4. **Direct 3rd party API** - Currently hardcoded to HuggingFace

---

## 🎓 Recommended Learning Path

### For Immediate Use
1. ✅ Add HF token to `.env.local`
2. ✅ Run `npm run dev`
3. ✅ Generate some websites at http://localhost:3000/new
4. ✅ Read QUICKSTART.md for troubleshooting

### For Advanced Integration
1. 📖 Read SETUP_GUIDE.md sections on:
   - Architecture
   - Third-party API options
   - MCP integration
2. 📖 Read INTEGRATION_EXAMPLES.md
3. 🔧 Run `node extract-prompts.js` to extract prompts
4. 🔧 Try the example scripts with your preferred AI API

### For Plugin Development
1. 📖 Read "Plugin/Extension Options" in SETUP_GUIDE.md
2. ⚠️ Consider effort vs. benefit
3. 💡 Alternative: Use extracted prompts in existing tools

---

## 🛠️ Files Created for You

```
deepsite/
├── .env.local                    ✅ Ready for your HF token
├── START_HERE.md                 📄 This file
├── SETUP_GUIDE.md                📘 Complete setup documentation
├── INTEGRATION_EXAMPLES.md       📗 Code examples for integrations
└── extract-prompts.js            🔧 Utility to extract prompts
```

---

## 🚦 Next Steps

**Right Now:**
1. Get your Hugging Face token
2. Add it to `.env.local`
3. Run `npm run dev`
4. Try it out!

**After Testing:**
- Want to use with Claude/OpenAI? → See INTEGRATION_EXAMPLES.md
- Want to build an MCP server? → See SETUP_GUIDE.md "MCP Integration"
- Want to extract prompts? → Run `node extract-prompts.js`

---

## 📊 Decision Matrix

### Should I use DeepSite as-is?
**YES if:**
- ✅ You want AI website generation now
- ✅ You're okay with Hugging Face API
- ✅ You want the full web UI experience

**EXTRACT PROMPTS if:**
- ✅ You want to use Claude/GPT-4/local models
- ✅ You want MCP integration
- ✅ You want custom workflows

**FORK & MODIFY if:**
- ⚠️ You need custom API endpoints
- ⚠️ You want different output formats
- ⚠️ You have time for development

---

## 🎯 The Bottom Line

**DeepSite works out of the box with just a free Hugging Face token.**

The real value is:
1. **Prompt Engineering** - How it instructs AI to generate good code
2. **User Experience** - Live preview, iterative editing, multi-page support
3. **Best Practices** - TailwindCSS, responsive design, CDN usage

You can either:
- **Use it directly** (easiest)
- **Extract prompts** (most flexible)
- **Fork & customize** (most work)

---

## ❓ FAQ

**Q: Do I need to pay for Hugging Face?**
A: No! Free tier includes generous API access. HF Pro ($9/mo) removes limits.

**Q: Can I use this with Claude/ChatGPT?**
A: Not directly, but you can extract the prompts. See INTEGRATION_EXAMPLES.md.

**Q: Can I run this offline?**
A: No, it requires Hugging Face API. But you can use extracted prompts with Ollama (local).

**Q: Is the generated code production-ready?**
A: It's a great starting point. Review and test before deploying.

**Q: Can I use this commercially?**
A: Yes! DeepSite is MIT licensed.

---

## 📞 Support

- **Hugging Face Issues**: https://huggingface.co/spaces/AnkhLP--deepsite/discussions
- **HF Token Help**: https://huggingface.co/settings/tokens
- **Next.js Docs**: https://nextjs.org/docs

---

## 🎉 Ready to Go!

1. Get token: https://huggingface.co/settings/tokens
2. Add to `.env.local`
3. Run: `npm run dev`
4. Create: http://localhost:3000/new

**Happy coding!** 🚀

---

*Generated by Claude Code - All documentation is ready for your return*

# 🚀 DeepSite Complete Launch Guide

## Quick Start

```bash
cd /Volumes/Duck_Drive/software-dev/git-toolbox/deepsite
./deepsite-launch.sh
```

That's it! The script will start:
- ✅ **DeepSite** (npm run dev) on `http://localhost:3000`
- ✅ **Cloudflare Tunnel** for remote access (auto-generated URL)
- ✅ **HuggingFace CodeLlama** AI model integration
- ✅ **SQLite Database** (local, no setup needed)

## What You Get

After running the script, you'll see a dashboard like this:

```
📊 SERVICE DASHBOARD

  🚀 DeepSite
     Local:  http://localhost:3000
     Remote: https://your-random-tunnel.trycloudflare.com

  🤖 AI Model
     Provider: HuggingFace
     Model:    CodeLlama-7B-Instruct
     Endpoint: https://truegleai-deepseek-coder-6b-api.hf.space/v1

  💾 Database
     Type:     SQLite (Local)
     Location: /Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/prisma/dev.db
```

## Sharing with Clients

The **Remote URL** (Cloudflare Tunnel) is a public link you can share with clients:
- No CORS errors (Cloudflare handles it)
- No port forwarding needed
- Auto-generated random URL each time
- No authentication required

**Example:**
```
Share this link with clients:
https://changing-oregon-potential-prerequisite.trycloudflare.com
```

## Viewing Logs

While the script is running, monitor services in another terminal:

```bash
# View DeepSite logs
tail -f /Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/.deepsite-logs/deepsite.log

# View Cloudflare Tunnel logs
tail -f /Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/.deepsite-logs/cloudflare.log

# Check running processes
ps aux | grep -E "next dev|cloudflared"
```

## Stopping Services

Press **Ctrl+C** in the terminal where you ran `./deepsite-launch.sh`

The script will gracefully shut down:
- DeepSite (Next.js dev server)
- Cloudflare Tunnel

## Features Enabled

### ✅ No Restrictions
- Unlimited project creation
- No rate limits
- Full token output (no capping)
- No Pro modal/paywall

### ✅ Local Storage
- All projects stored in SQLite database
- Offline capability (except AI generation)
- Auto-save every 30 seconds
- No data sent to external services (except to HF for AI)

### ✅ AI Generation
- HuggingFace CodeLlama-7B
- Unlimited free usage (on HF free tier)
- Streaming responses for real-time generation
- Full website generation in seconds

### ✅ Remote Access
- Cloudflare Tunnel for public sharing
- No CORS errors
- Perfect for client presentations
- Auto-generated URL each launch

## Environment Variables

The script automatically configures:

```bash
HF_TOKEN=your_token_here
CUSTOM_LLM_API_KEY=sk-hf-codellama
CUSTOM_LLM_BASE_URL=https://truegleai-deepseek-coder-6b-api.hf.space/v1
CUSTOM_LLM_MODEL=codellama-7b-instruct
```

These are in `.env.local` and loaded by the launch script.

## Troubleshooting

### Services won't start
```bash
# Check if ports are in use
lsof -i :3000

# Kill any existing processes
pkill -f "next dev"
pkill -f "cloudflared"

# Try again
./deepsite-launch.sh
```

### Cloudflare Tunnel URL not showing
Wait 20-30 seconds. The tunnel may be slow to start. Check logs:
```bash
tail -f .deepsite-logs/cloudflare.log
```

### DeepSite not responding
Check the logs:
```bash
tail -f .deepsite-logs/deepsite.log
```

### HuggingFace API errors
The CodeLlama model may need to wake up first time. It auto-sleeps after inactivity. First request will take 10-30 seconds.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│            CLIENT BROWSER                            │
│  http://localhost:3000  or  Public Tunnel URL        │
└─────────────┬──────────────────────────────┬─────────┘
              │                              │
              ▼                              ▼
        ┌─────────────┐             ┌──────────────────┐
        │  DeepSite   │             │  Cloudflare      │
        │  (Next.js)  │             │  Tunnel          │
        │  Port: 3000 │             │  (Public URL)    │
        └──────┬──────┘             └──────────────────┘
               │
       ┌───────┴──────────────┬─────────────┐
       ▼                      ▼             ▼
┌──────────────┐    ┌──────────────┐  ┌──────────┐
│   SQLite DB  │    │ CodeLlama AI │  │ HF Token │
│  (Local)     │    │  (HF Space)  │  │ Auth     │
└──────────────┘    └──────────────┘  └──────────┘
```

## Performance

- **DeepSite startup:** ~2-5 seconds
- **Cloudflare Tunnel:** ~5-10 seconds
- **Full startup:** ~10-15 seconds
- **AI generation:** ~5-30 seconds (first request slower as model wakes up)
- **Project save:** <1 second (local DB)

## Customization

To modify the launch configuration, edit:
- `deepsite-launch.sh` - Main launch script
- `.env.local` - Environment variables

## Next Steps

1. Run: `./deepsite-launch.sh`
2. Open: `http://localhost:3000`
3. Create a website with AI
4. Share public URL with clients
5. Edit and refine with unlimited AI generations
6. All changes saved locally

Enjoy your unlimited website generator! 🎉

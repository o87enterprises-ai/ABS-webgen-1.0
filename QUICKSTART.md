# DeepSite v3 - Quickstart Guide

## Overview
DeepSite v3 is a Vibe Coding Platform that integrates generative AI into your coding projects. It's built with Next.js 15, React 19, and uses Turbopack for fast development.

## System Requirements
- **Node.js**: v20 or higher
- **npm**: v11.6.2 or higher (comes with Node.js)
- **Disk Space**: ~10GB for node_modules
- **RAM**: Minimum 4GB, recommended 8GB+

## Installation

### Fresh Installation
```bash
# Clone or download from Hugging Face
# The files are cached at: ~/.cache/huggingface/hub/spaces--AnkhLP--deepsite/

# Copy to your project directory
cp -r ~/.cache/huggingface/hub/spaces--AnkhLP--deepsite/snapshots/*/  /path/to/your/directory

# Navigate to the directory
cd /path/to/your/directory

# Install dependencies (takes ~22 minutes)
npm install

# Fix security vulnerabilities (optional but recommended)
npm audit fix
npm audit fix --force  # Updates Next.js to latest compatible version
```

### Current Installation
**Location**: `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite`
- 402 packages installed
- node_modules size: 9.6GB
- Security: Critical vulnerabilities patched, 1 moderate remains

## Running DeepSite

### Development Mode (with hot reload)
```bash
npm run dev
```
- Server: http://localhost:3000
- Network: http://192.168.1.162:3000
- Startup time: ~15-30 seconds

### Production Mode
```bash
npm run build    # Build the application
npm start        # Start production server
```

### Docker (Alternative)
```bash
docker build -t deepsite .
docker run -p 3000:3000 deepsite
```

## Project Structure

```
deepsite/
├── app/                    # Next.js App Router (pages and layouts)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── ...                # Other routes
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...
├── lib/                  # Utility functions and libraries
├── hooks/                # React hooks
├── models/               # Data models (Mongoose schemas)
├── public/               # Static assets
├── types/                # TypeScript type definitions
├── assets/               # Additional assets
├── middleware.ts         # Next.js middleware
├── next.config.ts        # Next.js configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration (implied)
└── Dockerfile            # Docker configuration
```

## Key Technologies

### Frontend
- **Next.js 15.5.11**: React framework with App Router
- **React 19.1.0**: UI library
- **Turbopack**: Fast bundler (replaces Webpack)
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: Component library (Radix UI)
- **Monaco Editor**: Code editor (VS Code's editor)
- **Framer Motion**: Animation library

### Backend/Data
- **Mongoose**: MongoDB ODM
- **Next.js API Routes**: Backend endpoints
- **Server Actions**: Server-side functions

### AI Integration
- **Hugging Face Hub**: Model hosting
- **Hugging Face Inference**: AI model inference
- Supported models:
  - DeepSeek-V3/V3.1/V3.2
  - DeepSeek-R1
  - Qwen3-Coder-480B
  - Kimi-K2-Instruct
  - GLM-4.6

## Environment Configuration

Create a `.env.local` file in the root directory for environment variables:

```bash
# Example configuration (adjust as needed)
MONGODB_URI=mongodb://localhost:27017/deepsite
HUGGINGFACE_TOKEN=your_hf_token_here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production with Turbopack
npm start        # Start production server
npm audit        # Check for security vulnerabilities
npm audit fix    # Fix vulnerabilities automatically
npm fund         # Show funding information for packages
```

## Troubleshooting

### Server won't start
```bash
# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Memory issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Package conflicts
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Turbopack errors after updates
```bash
# Restart the dev server
# Kill the current process and run:
npm run dev
```

## Security Notes

- **Current Status**: Critical vulnerabilities patched ✓
- **Remaining**: 1 moderate vulnerability (requires Next.js v16 upgrade, breaking change)
- **Recommendation**: Safe for local development, review before production deployment

## Performance Tips

1. **First Run**: Initial compilation takes 15-30 seconds
2. **Hot Reload**: Changes reflect instantly after first compile
3. **Turbopack**: 700x faster than Webpack for updates
4. **Memory**: Keep at least 2GB free RAM during development

## Getting Help

- **Official Space**: https://huggingface.co/spaces/AnkhLP--deepsite
- **Discussion**: https://huggingface.co/spaces/enzostvs/deepsite/discussions/74
- **Next.js Docs**: https://nextjs.org/docs
- **Turbopack**: https://nextjs.org/docs/app/api-reference/next-config-js/turbopack

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `lsof -i :3000` | Check port 3000 status |
| `ps aux \| grep next` | Find Next.js processes |

---

**Current Status**: ✓ Installed, ✓ Secured, ✓ Running on http://localhost:3000

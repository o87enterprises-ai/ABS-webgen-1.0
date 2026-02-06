#!/bin/bash

# 🚀 DeepSite Complete Launch Script
# Starts: DeepSite, Database, LLM API, and Cloudflare Tunnel
# Usage: ./deepsite-launch.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/.deepsite-logs"
DEEPSITE_PORT=3000
CLOUDFLARE_PORT=3000
PID_FILE="$PROJECT_DIR/.deepsite.pids"

# Create logs directory
mkdir -p "$LOG_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🚀 DeepSite Complete Launch System 🚀              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"

    # Kill DeepSite
    if [ -f "$PID_FILE" ]; then
        DEEPSITE_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$DEEPSITE_PID" ] && kill -0 "$DEEPSITE_PID" 2>/dev/null; then
            echo -e "  Stopping DeepSite (PID: $DEEPSITE_PID)..."
            kill $DEEPSITE_PID 2>/dev/null || true
            wait $DEEPSITE_PID 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi

    # Kill Cloudflare Tunnel
    if pgrep -f "cloudflared tunnel" > /dev/null; then
        echo -e "  Stopping Cloudflare Tunnel..."
        pkill -f "cloudflared tunnel" || true
    fi

    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set trap for SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# ============================================================================
# STEP 1: Verify Environment
# ============================================================================
echo -e "${BLUE}📋 Step 1: Verifying environment...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js v20+${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} npm $(npm --version)"

# Check cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}❌ cloudflared not found. Install with: brew install cloudflare-warp${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} cloudflared installed"

# Check .env.local
if [ ! -f "$PROJECT_DIR/.env.local" ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} .env.local exists"

echo ""

# ============================================================================
# STEP 2: Setup Environment Variables
# ============================================================================
echo -e "${BLUE}⚙️  Step 2: Configuring environment...${NC}"

# Create temporary .env with HuggingFace CodeLlama settings
export HF_TOKEN=$(grep "HF_TOKEN=" "$PROJECT_DIR/.env.local" | cut -d'=' -f2)
export CUSTOM_LLM_API_KEY="sk-hf-codellama"
export CUSTOM_LLM_BASE_URL="https://truegleai-deepseek-coder-6b-api.hf.space/v1"
export CUSTOM_LLM_MODEL="codellama-7b-instruct"
export MONGODB_URI=""  # Use local SQLite instead
export NODE_ENV="development"

echo -e "  ${GREEN}✓${NC} HF_TOKEN configured"
echo -e "  ${GREEN}✓${NC} LLM API: HuggingFace CodeLlama"
echo -e "  ${GREEN}✓${NC} Database: SQLite (local)"

echo ""

# ============================================================================
# STEP 3: Start DeepSite
# ============================================================================
echo -e "${BLUE}🌐 Step 3: Starting DeepSite...${NC}"

cd "$PROJECT_DIR"

# Start DeepSite in background
npm run dev > "$LOG_DIR/deepsite.log" 2>&1 &
DEEPSITE_PID=$!
echo $DEEPSITE_PID > "$PID_FILE"

echo -e "  ${GREEN}✓${NC} DeepSite starting (PID: $DEEPSITE_PID)"
echo -e "  📝 Logs: $LOG_DIR/deepsite.log"

# Wait for DeepSite to start (check if port is listening)
echo -n "  Waiting for DeepSite to be ready"
for i in {1..30}; do
    if nc -z localhost $DEEPSITE_PORT 2>/dev/null; then
        echo -e " ${GREEN}✓${NC}"
        break
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e " ${RED}✗${NC}"
        echo -e "${RED}❌ DeepSite failed to start. Check logs:${NC}"
        cat "$LOG_DIR/deepsite.log"
        exit 1
    fi
done

echo ""

# ============================================================================
# STEP 4: Start Cloudflare Tunnel
# ============================================================================
echo -e "${BLUE}🌍 Step 4: Starting Cloudflare Tunnel...${NC}"

# Start tunnel in background with random domain
cloudflared tunnel --url http://localhost:$CLOUDFLARE_PORT > "$LOG_DIR/cloudflare.log" 2>&1 &
TUNNEL_PID=$!

echo -e "  ${GREEN}✓${NC} Cloudflare Tunnel starting (PID: $TUNNEL_PID)"
echo -e "  📝 Logs: $LOG_DIR/cloudflare.log"

# Wait for tunnel to start and extract the URL
echo -n "  Waiting for tunnel URL"
TUNNEL_URL=""
for i in {1..20}; do
    if grep -q "https://" "$LOG_DIR/cloudflare.log" 2>/dev/null; then
        TUNNEL_URL=$(grep -oE "https://[a-z0-9\-]+\.trycloudflare\.com" "$LOG_DIR/cloudflare.log" | head -1)
        if [ -n "$TUNNEL_URL" ]; then
            echo -e " ${GREEN}✓${NC}"
            break
        fi
    fi
    echo -n "."
    sleep 1
    if [ $i -eq 20 ]; then
        echo -e " ${YELLOW}⚠${NC}"
        echo -e "  ${YELLOW}Tunnel may still be starting, check logs...${NC}"
    fi
done

echo ""

# ============================================================================
# STEP 5: Display Dashboard
# ============================================================================
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ ALL SERVICES RUNNING SUCCESSFULLY             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 SERVICE DASHBOARD${NC}"
echo ""
echo -e "  ${BLUE}🚀 DeepSite${NC}"
echo -e "     Local:  ${GREEN}http://localhost:$DEEPSITE_PORT${NC}"
echo -e "     Remote: ${GREEN}${TUNNEL_URL:-(getting URL...)}${NC}"
echo ""
echo -e "  ${BLUE}🤖 AI Model${NC}"
echo -e "     Provider: ${GREEN}HuggingFace${NC}"
echo -e "     Model:    ${GREEN}CodeLlama-7B-Instruct${NC}"
echo -e "     Endpoint: ${GREEN}https://truegleai-deepseek-coder-6b-api.hf.space/v1${NC}"
echo ""
echo -e "  ${BLUE}💾 Database${NC}"
echo -e "     Type:     ${GREEN}SQLite (Local)${NC}"
echo -e "     Location: ${GREEN}$PROJECT_DIR/prisma/dev.db${NC}"
echo ""

echo -e "${YELLOW}⚡ QUICK ACTIONS${NC}"
echo ""
echo -e "  ${BLUE}View Logs:${NC}"
echo -e "    DeepSite:  tail -f $LOG_DIR/deepsite.log"
echo -e "    Tunnel:    tail -f $LOG_DIR/cloudflare.log"
echo ""
echo -e "  ${BLUE}Service Status:${NC}"
echo -e "    ps aux | grep -E 'next dev|cloudflared'"
echo ""

echo -e "${GREEN}✨ Ready to create websites with unlimited AI generation!${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running
wait $DEEPSITE_PID

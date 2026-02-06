#!/bin/bash

# LLM Process Manager - Status Checker and Management Tool
# Manages: Local LLM API Server, MCP Monitor, and HuggingFace Space

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOCAL_API_URL="http://localhost:8081"
HF_SPACE_URL="https://truegleai-deepseek-coder-6b-api.hf.space"
LLM_API_SCRIPT="/Users/ducke.duck_1/mcp-monitoring-server/authenticated_llm_api.py"
MCP_MONITOR_SCRIPT="/Users/ducke.duck_1/mcp-monitoring-server/llm_cli_integration.py"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         LLM Process Manager - Status Dashboard             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Function to check if process is running
check_process() {
    local script_name=$1
    local pid=$(ps aux | grep "$script_name" | grep -v grep | awk '{print $2}' | head -1)
    if [ -n "$pid" ]; then
        echo -e "${GREEN}✅ RUNNING${NC} (PID: $pid)"
        return 0
    else
        echo -e "${RED}❌ NOT RUNNING${NC}"
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ ONLINE${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ OFFLINE${NC} (HTTP $response)"
        return 1
    fi
}

# Function to get port usage
check_port() {
    local port=$1
    local process=$(lsof -i :$port -P -n | grep LISTEN | awk '{print $1, $2}' | head -1)
    if [ -n "$process" ]; then
        echo -e "${GREEN}✅ Port $port${NC} - $process"
        return 0
    else
        echo -e "${YELLOW}⚠️  Port $port${NC} - Not in use"
        return 1
    fi
}

# Check Local LLM API Server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}1. Local LLM API Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "   Process Status: "
check_process "authenticated_llm_api.py"
API_RUNNING=$?

echo -n "   API Endpoint:   "
check_endpoint "$LOCAL_API_URL/api_key"
API_ENDPOINT=$?

echo -n "   Port Status:    "
check_port 8081
echo ""

# Check MCP Monitor
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}2. MCP Monitor${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "   Process Status: "
check_process "llm_cli_integration.py"
MCP_RUNNING=$?
echo ""

# Check HuggingFace Space
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}3. HuggingFace Space API${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "   API Status:     "
check_endpoint "$HF_SPACE_URL"
HF_RUNNING=$?
echo "   Space URL:      $HF_SPACE_URL"
echo ""

# Overall Status Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Overall Status                          ║"
echo "╚════════════════════════════════════════════════════════════╝"

if [ $API_RUNNING -eq 0 ] && [ $MCP_RUNNING -eq 0 ] && [ $HF_RUNNING -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some services need attention:${NC}"
    [ $API_RUNNING -ne 0 ] && echo "   - Local LLM API Server is not running"
    [ $MCP_RUNNING -ne 0 ] && echo "   - MCP Monitor is not running"
    [ $HF_RUNNING -ne 0 ] && echo "   - HuggingFace Space API is not responding"
    echo ""
    echo "Management Commands:"
    echo "   Start LLM API:   cd /Users/ducke.duck_1/mcp-monitoring-server && python3 authenticated_llm_api.py"
    echo "   Start MCP:       llm-launch"
    echo "   Check HF Space:  Open https://huggingface.co/spaces/truegleai/deepseek-coder-6b-api"
    exit 1
fi

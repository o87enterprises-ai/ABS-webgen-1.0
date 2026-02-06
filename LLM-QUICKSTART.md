# 🚀 LLM Process Manager - Quick Start Guide

## Installation

```bash
# Make the script available system-wide
sudo ln -s /Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/llm-manager /usr/local/bin/llm-manager
```

---

## 📋 Management Commands

```bash
# Check status of all services
llm-manager

# Start all services
llm-manager start

# Stop all services
llm-manager stop

# Restart all services
llm-manager restart

# Individual service control
llm-manager start-api         # Start only LLM API server
llm-manager start-mcp         # Start only MCP monitor
llm-manager start-dashboard   # Start only Unified Dashboard Web GUI
llm-manager stop-api          # Stop only LLM API server
llm-manager stop-mcp          # Stop only MCP monitor
llm-manager stop-dashboard    # Stop only Unified Dashboard Web GUI
```

---

## 🔗 Service URLs & Access Points

### 1. **Local LLM API Server**
- **Base URL:** http://localhost:8081
- **API Key Endpoint:** http://localhost:8081/api_key
- **Health Check:** http://localhost:8081/health (if available)
- **Port:** 8081
- **Process:** `authenticated_llm_api.py`

**API Key:**
```
sk-private-Ck_ohYo6UkhChY9Yikxa_ySLjzHyWPyqhP6oj-hAoZ8
```

**Retrieve API Key:**
```bash
curl http://localhost:8081/api_key
```

### 2. **Unified Dashboard Web GUI** 🆕
- **Dashboard URL:** http://localhost:8080
- **Port:** 8080
- **Process:** `unified_dashboard_server.py`
- **Features:** Web interface for monitoring and managing all MCP services

**Access Dashboard:**
Open http://localhost:8080 in your browser

### 3. **HuggingFace Space API**
- **URL:** https://truegleai-deepseek-coder-6b-api.hf.space
- **Dashboard:** https://huggingface.co/spaces/truegleai/deepseek-coder-6b-api
- **Model:** deepseek-coder-6.7b-instruct / codellama-7b-instruct

**Test HF Space:**
```bash
curl https://truegleai-deepseek-coder-6b-api.hf.space
```

### 4. **MCP Monitor**
- **Process:** `llm_cli_integration.py`
- **Location:** `/Users/ducke.duck_1/mcp-monitoring-server`
- **Launch Command:** `llm-launch`

---

## 🛠️ Manual Start Commands

If you need to start services manually without the manager:

### Start LLM API Server
```bash
cd /Users/ducke.duck_1/mcp-monitoring-server
python3 authenticated_llm_api.py
```

### Start MCP Monitor
```bash
llm-launch
```

---

## 🔍 Troubleshooting

### Check if processes are running
```bash
# Check LLM API
ps aux | grep authenticated_llm_api.py | grep -v grep

# Check MCP Monitor
ps aux | grep llm_cli_integration.py | grep -v grep

# Check which process is using port 8081
lsof -i :8081
```

### Test API endpoints
```bash
# Test local API
curl http://localhost:8081/api_key

# Test HuggingFace Space
curl https://truegleai-deepseek-coder-6b-api.hf.space
```

### View process logs
```bash
# If running in background, find the process
ps aux | grep authenticated_llm_api

# Kill a stuck process
kill <PID>

# Force kill if needed
kill -9 <PID>
```

---

## 📊 Quick Health Check

```bash
# One command to check everything
llm-manager status
```

Expected output when healthy:
```
✅ Local LLM API Server - RUNNING (PID: XXXX)
✅ API Endpoint - ONLINE (HTTP 200)
✅ MCP Monitor - RUNNING (PID: XXXX)
✅ Unified Dashboard Web GUI - RUNNING (PID: XXXX)
✅ Web Interface - ONLINE at http://localhost:8080
✅ HuggingFace Space API - ONLINE (HTTP 200)
```

---

## 🎯 Common Workflows

### Starting your coding session
```bash
llm-manager start     # Start all services
llm-manager status    # Verify everything is running
```

### Ending your coding session
```bash
llm-manager stop      # Stop all services
```

### If something goes wrong
```bash
llm-manager restart   # Restart everything
```

### Check status anytime
```bash
llm-manager           # Default is status check
```

---

## 🔐 OpenCode Configuration

To use your private LLM with OpenCode:

```bash
opencode config set apiKey "sk-private-Ck_ohYo6UkhChY9Yikxa_ySLjzHyWPyqhP6oj-hAoZ8"
opencode config set baseURL "http://localhost:8081/v1"
opencode config set model "deepseek-coder-6.7b-instruct"
```

Then start OpenCode:
```bash
opencode
```

---

## 📁 Important File Locations

- **Manager Script:** `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/llm-manager`
- **LLM API Script:** `/Users/ducke.duck_1/mcp-monitoring-server/authenticated_llm_api.py`
- **MCP Monitor:** `/Users/ducke.duck_1/mcp-monitoring-server/llm_cli_integration.py`
- **This Guide:** `/Volumes/Duck_Drive/software-dev/git-toolbox/deepsite/LLM-QUICKSTART.md`

---

## ⚡ Pro Tips

1. **Add to startup:** If you want these to start automatically, add `llm-manager start` to your shell profile
2. **Monitor in real-time:** Use `watch llm-manager status` to continuously monitor (requires `watch` command)
3. **Quick check:** Bookmark http://localhost:8081/api_key in your browser for quick access
4. **Alias for speed:** Add `alias llm='llm-manager'` to your shell profile for even shorter commands

---

## 🆘 Need Help?

```bash
llm-manager help
```

**Current Status Check:**
```bash
llm-manager
```

That's it! Your LLM environment is ready to use. 🎉

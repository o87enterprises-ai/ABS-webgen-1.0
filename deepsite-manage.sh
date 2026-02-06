#!/bin/bash

# DeepSite Service Manager
# Usage: ./deepsite-manage.sh [status|logs|stop|restart]

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/.deepsite-logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

command=${1:-status}

case $command in
    status)
        echo -e "${BLUE}📊 DeepSite Services Status${NC}\n"

        # Check DeepSite
        if pgrep -f "next dev" > /dev/null; then
            PID=$(pgrep -f "next dev")
            echo -e "${GREEN}✓${NC} DeepSite running (PID: $PID)"
            echo -e "  Local:  http://localhost:3000"
        else
            echo -e "${RED}✗${NC} DeepSite not running"
        fi

        # Check Cloudflare Tunnel
        if pgrep -f "cloudflared tunnel" > /dev/null; then
            PID=$(pgrep -f "cloudflared tunnel")
            echo -e "${GREEN}✓${NC} Cloudflare Tunnel running (PID: $PID)"
            if [ -f "$LOG_DIR/cloudflare.log" ]; then
                URL=$(grep -oE "https://[a-z0-9\-]+\.trycloudflare\.com" "$LOG_DIR/cloudflare.log" | head -1)
                if [ -n "$URL" ]; then
                    echo -e "  Remote: $URL"
                fi
            fi
        else
            echo -e "${RED}✗${NC} Cloudflare Tunnel not running"
        fi

        # Check Database
        if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
            SIZE=$(du -h "$PROJECT_DIR/prisma/dev.db" | cut -f1)
            echo -e "${GREEN}✓${NC} SQLite Database exists ($SIZE)"
        else
            echo -e "${YELLOW}⚠${NC} SQLite Database not yet created"
        fi

        echo ""
        ;;

    logs)
        echo -e "${BLUE}📝 Streaming Logs${NC}"
        echo -e "${BLUE}Press Ctrl+C to stop${NC}\n"

        # Tail both logs at once
        tail -f "$LOG_DIR/deepsite.log" "$LOG_DIR/cloudflare.log" 2>/dev/null
        ;;

    deepsite-logs)
        echo -e "${BLUE}📝 DeepSite Logs${NC}\n"
        tail -f "$LOG_DIR/deepsite.log"
        ;;

    tunnel-logs)
        echo -e "${BLUE}📝 Cloudflare Tunnel Logs${NC}\n"
        tail -f "$LOG_DIR/cloudflare.log"
        ;;

    stop)
        echo -e "${YELLOW}🛑 Stopping DeepSite services...${NC}\n"

        # Kill DeepSite
        if pgrep -f "next dev" > /dev/null; then
            echo -e "  Stopping DeepSite..."
            pkill -f "next dev"
            sleep 1
        fi

        # Kill Cloudflare Tunnel
        if pgrep -f "cloudflared tunnel" > /dev/null; then
            echo -e "  Stopping Cloudflare Tunnel..."
            pkill -f "cloudflared tunnel"
            sleep 1
        fi

        echo -e "${GREEN}✓ All services stopped${NC}"
        ;;

    restart)
        echo -e "${YELLOW}🔄 Restarting services...${NC}\n"
        "$0" stop
        sleep 2
        cd "$PROJECT_DIR"
        ./deepsite-launch.sh
        ;;

    info)
        echo -e "${BLUE}ℹ️  DeepSite Configuration${NC}\n"
        echo -e "${YELLOW}Environment Variables:${NC}"
        echo "  HF_TOKEN: ${HF_TOKEN:0:20}..."
        echo "  LLM API:  $(grep CUSTOM_LLM_BASE_URL "$PROJECT_DIR/.env.local" | cut -d'=' -f2)"
        echo "  LLM Model: $(grep CUSTOM_LLM_MODEL "$PROJECT_DIR/.env.local" | cut -d'=' -f2)"
        echo ""
        echo -e "${YELLOW}Database:${NC}"
        echo "  Type: SQLite"
        echo "  Location: $PROJECT_DIR/prisma/dev.db"
        echo ""
        echo -e "${YELLOW}Directories:${NC}"
        echo "  Project: $PROJECT_DIR"
        echo "  Logs: $LOG_DIR"
        echo ""
        ;;

    help|--help|-h)
        echo -e "${BLUE}DeepSite Service Manager${NC}"
        echo ""
        echo -e "${YELLOW}Usage:${NC} ./deepsite-manage.sh [command]"
        echo ""
        echo -e "${YELLOW}Commands:${NC}"
        echo "  status          Show service status"
        echo "  logs            Stream all logs (Ctrl+C to stop)"
        echo "  deepsite-logs   Stream only DeepSite logs"
        echo "  tunnel-logs     Stream only Tunnel logs"
        echo "  stop            Stop all services"
        echo "  restart         Restart all services"
        echo "  info            Show configuration info"
        echo "  help            Show this help message"
        echo ""
        ;;

    *)
        echo -e "${RED}Unknown command: $command${NC}"
        echo "Run './deepsite-manage.sh help' for usage"
        exit 1
        ;;
esac

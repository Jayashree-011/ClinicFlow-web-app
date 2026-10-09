#!/bin/bash

# ============================================================================
# ClinicFlow Microservices Stop Script for Linux/Mac
# Stops all running microservices
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo "============================================================================"
echo "Stopping ClinicFlow Microservices"
echo "============================================================================"
echo ""

# Check if .pids file exists
if [ -f "$SCRIPT_DIR/.pids" ]; then
    echo -e "${YELLOW}Stopping services from .pids file...${NC}"
    killed_count=0
    while IFS= read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null
            echo -e "${GREEN}[✓]${NC} Stopped process $pid"
            ((killed_count++))
        fi
    done < "$SCRIPT_DIR/.pids"
    rm "$SCRIPT_DIR/.pids"
    echo -e "${GREEN}Stopped $killed_count service(s).${NC}"
else
    echo -e "${YELLOW}No .pids file found. Searching for Maven/Spring Boot processes...${NC}"
    
    # Kill Maven java processes
    pkill -f "mvn spring-boot:run" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[✓]${NC} Stopped Maven Spring Boot processes"
    else
        echo -e "${RED}[!]${NC} No Maven Spring Boot processes found"
    fi
fi

echo ""
echo "============================================================================"
echo -e "${GREEN}All services have been stopped.${NC}"
echo "============================================================================"
echo ""

#!/bin/bash

# ============================================================================
# ClinicFlow Microservices Startup Script for Linux/Mac
# Runs all microservices in parallel
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/clinicflow-backend"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

export SPRING_PROFILES_ACTIVE=prod

echo ""
echo "============================================================================"
echo "Starting ClinicFlow Microservices"
echo "============================================================================"
echo ""
echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Initializing services..."
echo ""

# Function to start a service
start_service() {
    local service_name=$1
    local service_port=$2
    local display_color=$3
    
    echo -e "${GREEN}[*]${NC} Starting ${display_color}${service_name}${NC}"
    
    if [ "$service_port" = "dynamic" ]; then
        echo -e "    ${YELLOW}Port: Dynamic (check console or discovery server)${NC}"
    else
        echo -e "    ${YELLOW}Port: $service_port${NC}"
    fi
    
    # Start the service in background
    (
        cd "$BACKEND_DIR/$service_name"
        mvn spring-boot:run > "$SCRIPT_DIR/logs/${service_name}.log" 2>&1
    ) &
    
    # Store PID for later cleanup
    echo $! >> "$SCRIPT_DIR/.pids"
    
    # Brief pause between starts to avoid overwhelming the system
    sleep 1
}

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Clear old PIDs file
> "$SCRIPT_DIR/.pids"

# ── Spring Services ───────────────────────────────────────────────────────────

# Start services in order (config and discovery first)
start_service "config-server" "8701" "$BLUE"
sleep 2

start_service "discovery-server" "8710" "$BLUE"
sleep 2

start_service "api-gateway" "8700" "$GREEN"
sleep 1

start_service "user-service" "dynamic" "$YELLOW"
sleep 1

start_service "consultation-service" "dynamic" "$YELLOW"
sleep 1

start_service "lab-service" "dynamic" "$YELLOW"
sleep 1

start_service "notification-service" "dynamic" "$YELLOW"

echo ""
echo "============================================================================"
echo -e "${GREEN}All services are starting...${NC}"
echo "============================================================================"
echo ""
echo -e "${BLUE}Service Details:${NC}"
echo "  - Config Server:        http://localhost:8701"
echo "  - Discovery Server:     http://localhost:8710"
echo "  - API Gateway:          http://localhost:8700"
echo "  - User Service:         (Dynamic port)"
echo "  - Consultation Service: (Dynamic port)"
echo "  - Lab Service:          (Dynamic port)"
echo "  - Notification Service: (Dynamic port)"
echo ""
echo -e "${YELLOW}Service logs are available at:${NC}"
echo "  $SCRIPT_DIR/logs/"
echo ""
echo -e "${YELLOW}To stop all services, press Ctrl+C or run:${NC}"
echo "  ./stop-all-services.sh"
echo ""
echo "============================================================================"
echo ""

# Function to cleanup on script exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${NC}"

    # Stop Spring/Kafka processes tracked by PID
    if [ -f "$SCRIPT_DIR/.pids" ]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null
                echo -e "${GREEN}[✓]${NC} Killed process $pid"
            fi
        done < "$SCRIPT_DIR/.pids"
        rm "$SCRIPT_DIR/.pids"
    fi

    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set trap to cleanup on script exit or interrupt
trap cleanup SIGINT SIGTERM EXIT

# Keep the script running
wait

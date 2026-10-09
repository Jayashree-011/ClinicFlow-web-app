#!/bin/bash

# Encounter Microservice Deployment Script
# This script automates the deployment of the Encounter service

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="encounter-service"
BUILD_DIR="target"
JAR_FILE="Encounter-0.0.1-SNAPSHOT.jar"
DOCKER_IMAGE="clinicflow/encounter-service"
DATABASE_NAME="clinicflow_encounter"
MYSQL_USER="root"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"

# Functions
print_header() {
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check Java
    if ! command -v java &> /dev/null; then
        print_error "Java not found. Please install Java 21+."
        exit 1
    fi
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    print_success "Java found: $JAVA_VERSION"
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        print_error "Maven not found. Please install Maven 3.8+."
        exit 1
    fi
    MVN_VERSION=$(mvn -v | head -1)
    print_success "Maven found: $MVN_VERSION"
    
    # Check MySQL
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL client not found."
        exit 1
    fi
    print_success "MySQL client found"
}

# Setup database
setup_database() {
    print_header "Setting Up Database"
    
    print_info "Creating database '$DATABASE_NAME'..."
    read -p "Enter MySQL root password: " -s MYSQL_PASSWORD
    echo
    
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DATABASE_NAME;" ||
    {
        print_error "Failed to create database. Check MySQL connection."
        exit 1
    }
    
    print_success "Database created"
    
    print_info "Running schema script..."
    mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$DATABASE_NAME" < schema.sql ||
    {
        print_error "Failed to run schema script."
        exit 1
    }
    
    print_success "Schema initialized"
}

# Build application
build_application() {
    print_header "Building Application"
    
    print_info "Running Maven build..."
    mvn clean package -DskipTests ||
    {
        print_error "Maven build failed."
        exit 1
    }
    
    print_success "Application built successfully"
    print_info "JAR file: $BUILD_DIR/$JAR_FILE"
}

# Build Docker image
build_docker_image() {
    print_header "Building Docker Image"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Skipping Docker build."
        return 1
    fi
    
    print_info "Building Docker image: $DOCKER_IMAGE:latest..."
    docker build -t "$DOCKER_IMAGE:latest" . ||
    {
        print_error "Docker build failed."
        exit 1
    }
    
    print_success "Docker image built: $DOCKER_IMAGE:latest"
}

# Run application
run_application() {
    print_header "Running Application"
    
    print_info "Starting Encounter service on port 8081..."
    java -jar "$BUILD_DIR/$JAR_FILE" &
    SERVICE_PID=$!
    
    print_info "Service PID: $SERVICE_PID"
    
    # Wait for service to start
    print_info "Waiting for service to start..."
    sleep 10
    
    # Health check
    if curl -f http://localhost:8081/encounter-service/health &> /dev/null; then
        print_success "Service is healthy and running"
        print_info "Access the service at: http://localhost:8081/encounter-service"
    else
        print_error "Service health check failed"
        kill $SERVICE_PID 2>/dev/null || true
        exit 1
    fi
}

# Run Docker Compose
run_docker_compose() {
    print_header "Running with Docker Compose"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose not found."
        exit 1
    fi
    
    print_info "Starting services with Docker Compose..."
    docker-compose up -d ||
    {
        print_error "Failed to start Docker Compose."
        exit 1
    }
    
    print_success "Services started successfully"
    print_info "Check status: docker-compose ps"
    print_info "View logs: docker-compose logs -f"
}

# Run tests
run_tests() {
    print_header "Running Tests"
    
    print_info "Running unit tests..."
    mvn test ||
    {
        print_error "Tests failed."
        exit 1
    }
    
    print_success "All tests passed"
}

# Main menu
show_menu() {
    echo
    print_header "Encounter Microservice Deployment"
    echo "1. Check dependencies"
    echo "2. Setup database"
    echo "3. Build application"
    echo "4. Run tests"
    echo "5. Build Docker image"
    echo "6. Run with Maven"
    echo "7. Run with Docker Compose"
    echo "8. Full setup (1-4, 7)"
    echo "9. Exit"
    echo
}

# Main script
main() {
    while true; do
        show_menu
        read -p "Select option: " choice
        
        case $choice in
            1)
                check_dependencies
                ;;
            2)
                setup_database
                ;;
            3)
                build_application
                ;;
            4)
                run_tests
                ;;
            5)
                build_docker_image
                ;;
            6)
                build_application
                run_application
                ;;
            7)
                build_application
                build_docker_image
                run_docker_compose
                ;;
            8)
                check_dependencies
                setup_database
                run_tests
                build_application
                build_docker_image
                run_docker_compose
                ;;
            9)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
    done
}

# Run main
main

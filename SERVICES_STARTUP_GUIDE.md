# ClinicFlow Microservices - Parallel Startup Guide

This directory contains scripts to easily start and stop all ClinicFlow microservices in parallel.

## Overview

The ClinicFlow backend consists of the following microservices:

| Service | Port | Type | Description |
|---------|------|------|-------------|
| **config-server** | 8701 | Configuration | Central configuration server |
| **discovery-server** | 8710 | Service Discovery | Eureka server for service registration |
| **api-gateway** | 8700 | Gateway | API Gateway for routing requests |
| **user-service** | Dynamic | Microservice | User management service |
| **consultation-service** | Dynamic | Microservice | Appointment/consultation service |
| **lab-service** | Dynamic | Microservice | Laboratory test management |
| **notification-service** | Dynamic | Microservice | Notification service |

**Note:** Services with dynamic ports are assigned random ports at startup and register with the discovery server.

## Prerequisites

- Java 21 JDK installed
- Maven 3.8.0 or higher installed
- Git (optional, only if you're cloning the repo)

### Verify Prerequisites

```bash
java -version
mvn -version
```

## Windows Setup

### Quick Start

1. **Start all services:**
   ```batch
   run-all-services.bat
   ```
   This will open separate console windows for each microservice and display startup information.

2. **Stop all services:**
   ```batch
   stop-all-services.bat
   ```
   This will stop all Java processes running on your system.

### What Happens

- Each service starts in its own console window
- Services start with a 1-3 second delay between each to avoid overwhelming the system
- The main window displays which services are starting and their ports
- All services run in parallel in the background

### Monitoring

To check if services are running:
1. Open Task Manager and look for `java.exe` processes
2. Check the console windows for each service
3. Visit the discovery server: http://localhost:8710 to see registered services

### Stopping Services

There are two ways to stop services:

**Option 1:** Use the stop script
```batch
stop-all-services.bat
```

**Option 2:** Close each console window individually or use Task Manager to kill `java.exe` processes

## Linux/Mac Setup

### Quick Start

1. **Make scripts executable:**
   ```bash
   chmod +x run-all-services.sh
   chmod +x stop-all-services.sh
   ```

2. **Start all services:**
   ```bash
   ./run-all-services.sh
   ```
   Services will start in the background and logs will be saved to `logs/` directory.

3. **Stop all services:**
   ```bash
   ./stop-all-services.sh
   ```
   Or press `Ctrl+C` in the main terminal where you ran the startup script.

### What Happens

- Each service starts in the background
- Service logs are saved to individual files in the `logs/` directory
- The script displays status messages with timestamps
- Process IDs are stored in `.pids` file for clean shutdown
- Services start with staggered 1-2 second delays

### Monitoring

Check service logs:
```bash
# View all logs
tail -f logs/*.log

# View specific service log
tail -f logs/config-server.log
tail -f logs/api-gateway.log

# List active processes
ps aux | grep mvn
```

Check if services are running:
```bash
# View running services
netstat -tuln | grep LISTEN

# Or check discovery server
curl http://localhost:8710
```

## Startup Order

Services start in this specific order to ensure proper initialization:

1. **config-server** (waits 2 seconds)
2. **discovery-server** (waits 2 seconds)
3. **api-gateway** (waits 1 second)
4. **user-service** (waits 1 second)
6. **consultation-service** (waits 1 second)
7. **lab-service** (waits 1 second)
8. **notification-service**

This order ensures:
- Configuration is available for all services
- Discovery server is ready before services register
- Core services are up before dependent services

## Verification

After starting services, verify they are running:

### Using Browser

1. **Config Server:** http://localhost:8701
2. **Discovery Server (Eureka):** http://localhost:8710
3. **API Gateway:** http://localhost:8700

### Using curl (Linux/Mac/Windows PowerShell)

```bash
# Check config server
curl http://localhost:8701

# Check discovery server (Eureka)
curl http://localhost:8710/eureka/apps

# Check API gateway
curl http://localhost:8700
```

## Troubleshooting

### Services won't start

1. **Check if ports are already in use:**
   ```bash
   # Windows (PowerShell)
   netstat -ano | findstr :8701
   
   # Linux/Mac
   lsof -i :8701
   ```

2. **Check Java installation:**
   ```bash
   java -version
   ```

3. **Check Maven:**
   ```bash
   mvn -version
   ```

4. **Try building services first:**
   ```bash
   cd clinicflow-backend
   mvn clean install -DskipTests
   ```

### A service crashes immediately

1. Check the console/log output for the error message
2. Verify that config-server started successfully
3. Verify that discovery-server is running
4. Check if there are port conflicts

### Running out of memory

If services crash due to memory issues, you can increase JVM heap size. For Windows:

```batch
set MAVEN_OPTS=-Xmx1024m -Xms512m
run-all-services.bat
```

For Linux/Mac:

```bash
export MAVEN_OPTS="-Xmx1024m -Xms512m"
./run-all-services.sh
```

## Advanced Usage

### Running Individual Services

To run a single service:

```bash
cd clinicflow-backend/[service-name]
mvn spring-boot:run
```

### Custom Profiles

To run with a specific Spring profile (e.g., prod instead of test):

**Windows:**
```batch
set SPRING_PROFILES_ACTIVE=prod
run-all-services.bat
```

**Linux/Mac:**
```bash
export SPRING_PROFILES_ACTIVE=prod
./run-all-services.sh
```

### Building Before Running

To ensure all services are built before running:

```bash
cd clinicflow-backend
mvn clean install -DskipTests
cd ..
# Then run appropriate script
```

## Service Architecture

```
┌─────────────────────────┐
│   API Gateway :8700     │
│   (Routes requests)     │
└────────────┬────────────┘
             │
    ┌────────┴────────┬─────────┬──────────┐
    │                 │         │          │
    ▼                 ▼         ▼          ▼
┌─────────┐    ┌──────────┐ ┌──────┐  ┌─────────┐
│  User   │    │Consultat │ │ Lab  │  │Notifict │
│Service  │    │ Service  │ │Serv  │  │ Service │
└─────────┘    └──────────┘ └──────┘  └─────────┘
    │                 │         │          │
    └────────────┬────────────┬─────────┬──┘
                 │
         ┌───────▼─────────┐
         │Discovery Server │
         │ (Eureka:8710)   │
         └─────────────────┘
                 │
         ┌───────▼──────────┐
         │ Config Server    │
         │    (:8701)       │
         └──────────────────┘
```

## Clean Up

To remove logs and temporary files:

**Linux/Mac:**
```bash
rm -rf logs/
rm -f .pids
```

**Windows:**
```batch
rmdir /s /q logs
del .pids
```

## Notes

- The scripts assume Maven is installed and available in the system PATH
- Each service should have a `pom.xml` file in its directory
- Some services may fail to start if their dependencies (like databases) are not available
- Log files on Linux/Mac are stored in the `logs/` directory for debugging

## Support

If you encounter issues:
1. Check the individual service logs
2. Verify all prerequisites are installed
3. Ensure no ports are conflicting with other applications
4. Check the README.md files in individual service directories

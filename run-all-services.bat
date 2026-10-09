@echo off
REM ============================================================================
REM ClinicFlow Microservices Startup Script for Windows
REM Runs all microservices in parallel
REM ============================================================================

setlocal enabledelayedexpansion

set SPRING_PROFILES_ACTIVE=prod

REM Change to backend directory
cd /d "%~dp0clinicflow-backend"

echo.
echo ============================================================================
echo Starting ClinicFlow Microservices
echo ============================================================================
echo.

echo [%date% %time%] Starting services...
echo.

REM ── Spring Services ──────────────────────────────────────────────────────────

REM Start Config Server (must start first as other services depend on it)
echo [*] Starting Config Server (Port 8701)...
start "Config Server" cmd /k "cd config-server && mvn spring-boot:run"
timeout /t 5 /nobreak

REM Start Discovery Server (Eureka - second priority)
echo [*] Starting Discovery Server (Port 8710)...
start "Discovery Server" cmd /k "cd discovery-server && mvn spring-boot:run"
timeout /t 3 /nobreak

REM Start API Gateway
echo [*] Starting API Gateway (Port 8700)...
start "API Gateway" cmd /k "cd api-gateway && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start User Service
echo [*] Starting User Service (Dynamic Port)...
start "User Service" cmd /k "cd user-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Consultation Service
echo [*] Starting Consultation Service (Dynamic Port)...
start "Consultation Service" cmd /k "cd consultation-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Encounter Service
echo [*] Starting Encounter Service (Dynamic Port)...
start "Encounter Service" cmd /k "cd encounter-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Prescription Service
echo [*] Starting Prescription Service (Dynamic Port)...
start "Prescription Service" cmd /k "cd prescription-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Pharmacy Service
echo [*] Starting Pharmacy Service (Dynamic Port)...
start "Pharmacy Service" cmd /k "cd pharmacy-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Lab Service
echo [*] Starting Lab Service (Dynamic Port)...
start "Lab Service" cmd /k "cd lab-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Billing Service
echo [*] Starting Billing Service (Dynamic Port)... 
start "Billing Service" cmd /k "cd billing-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Notification Service
echo [*] Starting Notification Service (Dynamic Port)...
start "Notification Service" cmd /k "cd notification-service && mvn spring-boot:run"
timeout /t 2 /nobreak

REM Start Frontend (React)
echo [*] Starting Frontend (Port 5173)...
start "Frontend" cmd /k "cd ../clinicflow-frontend && npm run dev"
timeout /t 2 /nobreak

echo.
echo ============================================================================
echo All services are starting...
echo ============================================================================
echo.
echo Service Status and Details:
@REM echo  - Config Server:          http://localhost:8701
echo  - Discovery Server:       http://localhost:8710
echo  - API Gateway:            http://localhost:8700
echo  - User Service:           (Dynamic Port - Check Discovery Server)
echo  - Consultation Service:   (Dynamic Port - Check Discovery Server)
echo  - Encounter Service:      (Dynamic Port - Check Discovery Server)
echo  - Prescription Service:   (Dynamic Port - Check Discovery Server)
echo  - Pharmacy Service:       (Dynamic Port - Check Discovery Server)
echo  - Lab Service:            (Dynamic Port - Check Discovery Server)
echo  - Billing Service:         (Dynamic Port - Check Discovery Server)
echo  - Notification Service:    (Dynamic Port - Check Discovery Server)
echo.
echo To stop all services, close each console window or use a shutdown script.
echo ============================================================================
echo.

pause
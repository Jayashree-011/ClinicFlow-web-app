@echo off
REM ============================================================================
REM ClinicFlow Unit Test Runner for Windows
REM Runs all service tests in parallel (separate windows)
REM ============================================================================

setlocal enabledelayedexpansion

REM Change to backend directory
cd /d "%~dp0"

echo.
echo ============================================================================
echo Running ClinicFlow Unit Tests
echo ============================================================================
echo.

echo [%date% %time%] Launching test windows...
echo.

REM ── Unit Tests ───────────────────────────────────────────────────────────────

REM User Service
echo [*] Starting User Service tests...
start "TEST: User Service" cmd /k "cd user-service && mvn test"
timeout /t 1 /nobreak

REM Consultation Service
echo [*] Starting Consultation Service tests...
start "TEST: Consultation Service" cmd /k "cd consultation-service && mvn test"
timeout /t 1 /nobreak

REM Encounter Service
echo [*] Starting Encounter Service tests...
start "TEST: Encounter Service" cmd /k "cd encounter-service && mvn test"
timeout /t 1 /nobreak

REM Prescription Service
echo [*] Starting Prescription Service tests...
start "TEST: Prescription Service" cmd /k "cd prescription-service && mvn test"
timeout /t 1 /nobreak

REM Pharmacy Service
echo [*] Starting Pharmacy Service tests...
start "TEST: Pharmacy Service" cmd /k "cd pharmacy-service && mvn test"
timeout /t 1 /nobreak

REM Lab Service
echo [*] Starting Lab Service tests...
start "TEST: Lab Service" cmd /k "cd lab-service && mvn test"
timeout /t 1 /nobreak

REM Billing Service
echo [*] Starting Billing Service tests...
start "TEST: Billing Service" cmd /k "cd billing-service && mvn test"
timeout /t 1 /nobreak

REM Notification Service
echo [*] Starting Notification Service tests...
start "TEST: Notification Service" cmd /k "cd notification-service && mvn test"
timeout /t 1 /nobreak

echo.
echo ============================================================================
echo All test windows launched!
echo ============================================================================
echo.
echo Test Coverage:
echo  - User Service:           UserServiceTest               (18 tests)
echo  - Consultation Service:   DoctorServiceTest             (12 tests)
echo  - Consultation Service:   PatientAppointmentServiceTest (20 tests)
echo  - Encounter Service:      EncounterServiceTest          (16 tests)
echo  - Prescription Service:   PrescriptionServiceTest       (17 tests)
echo  - Pharmacy Service:       PharmacyServiceTest           (18 tests)
echo  - Lab Service:            LabOrderServiceTest           (13 tests)
echo  - Lab Service:            LabResultServiceTest          (13 tests)
echo  - Billing Service:        BillingServiceTest            (19 tests)
echo  - Notification Service:   NotificationServiceTest       (15 tests)
echo.
echo Total: ~161 unit tests across 8 services
echo.
echo Each window shows BUILD SUCCESS or BUILD FAILURE when done.
echo ============================================================================
echo.

pause

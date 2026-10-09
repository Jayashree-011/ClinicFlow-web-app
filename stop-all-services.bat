@echo off
echo ============================================================================
echo Stopping all ClinicFlow Microservices...
echo ============================================================================

REM Kill windows by their specific titles set in the start script
taskkill /FI "WINDOWTITLE eq Config Server*" /T /F
taskkill /FI "WINDOWTITLE eq Discovery Server*" /T /F
taskkill /FI "WINDOWTITLE eq API Gateway*" /T /F
taskkill /FI "WINDOWTITLE eq User Service*" /T /F
taskkill /FI "WINDOWTITLE eq Consultation Service*" /T /F
taskkill /FI "WINDOWTITLE eq Encounter Service*" /T /F
taskkill /FI "WINDOWTITLE eq Prescription Service*" /T /F
taskkill /FI "WINDOWTITLE eq Pharmacy Service*" /T /F
taskkill /FI "WINDOWTITLE eq Lab Service*" /T /F
taskkill /FI "WINDOWTITLE eq Billing Service*" /T /F
taskkill /FI "WINDOWTITLE eq Notification Service*" /T /F

echo.
echo ============================================================================
echo All targeted microservice windows have been terminated.
echo ============================================================================
pause
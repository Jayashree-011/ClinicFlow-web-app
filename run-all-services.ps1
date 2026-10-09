# ============================================================================
# ClinicFlow Microservices Startup Script for Windows PowerShell
# Runs all microservices in parallel with enhanced features
# ============================================================================

param(
    [switch]$Build = $false,
    [switch]$Clean = $false,
    [string]$Profile = "prod",
    [switch]$Help = $false
)

# Color codes
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

function Show-Help {
    Write-Host ""
    Write-Host "============================================================================"
    Write-Host "ClinicFlow Microservices Startup Script" -ForegroundColor $InfoColor
    Write-Host "============================================================================"
    Write-Host ""
    Write-Host "Usage: .\run-all-services.ps1 [Options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Build       Build all services before starting (runs mvn clean install)"
    Write-Host "  -Clean       Clean all services before building"
    Write-Host "  -Profile     Spring profile to use (default: test)"
    Write-Host "  -Help        Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\run-all-services.ps1                    # Start services with test profile"
    Write-Host "  .\run-all-services.ps1 -Build             # Build and start services"
    Write-Host "  .\run-all-services.ps1 -Profile prod      # Start with prod profile"
    Write-Host "  .\run-all-services.ps1 -Build -Clean      # Clean build all services"
    Write-Host ""
    Write-Host "============================================================================"
    Write-Host ""
}

if ($Help) {
    Show-Help
    exit
}

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
$BackendDir = Join-Path $ScriptDir "clinicflow-backend"

# Check if backend directory exists
if (-not (Test-Path $BackendDir)) {
    Write-Host "[!] Error: Backend directory not found at $BackendDir" -ForegroundColor $ErrorColor
    exit 1
}

# Set environment variable for profile
$env:SPRING_PROFILES_ACTIVE = $Profile

Push-Location $BackendDir

Write-Host ""
Write-Host "============================================================================"
Write-Host "Starting ClinicFlow Microservices" -ForegroundColor $InfoColor
Write-Host "============================================================================"
Write-Host ""
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Initializing services..." -ForegroundColor $InfoColor
Write-Host ""

# ── Spring Services ───────────────────────────────────────────────────────────

# Build if requested
if ($Build) {
    Write-Host "[*] Building all services..." -ForegroundColor $WarningColor
    if ($Clean) {
        Write-Host "[*] Running: mvn clean install -DskipTests" -ForegroundColor $InfoColor
        mvn clean install -DskipTests
    } else {
        Write-Host "[*] Running: mvn install -DskipTests" -ForegroundColor $InfoColor
        mvn install -DskipTests
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[!] Build failed!" -ForegroundColor $ErrorColor
        Pop-Location
        exit 1
    }
    Write-Host "[✓] Build completed successfully" -ForegroundColor $SuccessColor
    Write-Host ""
}

# Function to start a service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Port,
        [string]$Description
    )
    
    Write-Host "[*] Starting $ServiceName ($Description)" -ForegroundColor $SuccessColor
    
    $ServicePath = Join-Path $BackendDir $ServiceName
    
    # Start the service in a new window
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/k", "cd /d $ServicePath && mvn spring-boot:run" `
        -WindowStyle Normal

    Start-Sleep -Seconds 1
}

# Array of services to start
$Services = @(
    @{ Name = "config-server"; Port = "8701"; Description = "Configuration Server" },
    @{ Name = "discovery-server"; Port = "8710"; Description = "Service Discovery (Eureka)" },
    @{ Name = "api-gateway"; Port = "8700"; Description = "API Gateway" },
    @{ Name = "user-service"; Port = "Dynamic"; Description = "User Management" },
    @{ Name = "consultation-service"; Port = "Dynamic"; Description = "Appointments" },
    @{ Name = "lab-service"; Port = "Dynamic"; Description = "Lab Tests" },
    @{ Name = "notification-service"; Port = "Dynamic"; Description = "Notifications" }
)

# Start core services first
Write-Host "[*] Starting core services..." -ForegroundColor $WarningColor
Start-Service -ServiceName "config-server" -Port "8701" -Description "Configuration Server"
Start-Sleep -Seconds 3

Start-Service -ServiceName "discovery-server" -Port "8710" -Description "Service Discovery"
Start-Sleep -Seconds 3

# Start gateway and supporting services
Write-Host "[*] Starting gateway services..." -ForegroundColor $WarningColor
Start-Service -ServiceName "api-gateway" -Port "8700" -Description "API Gateway"
Start-Sleep -Seconds 2

# Start microservices
Write-Host "[*] Starting microservices..." -ForegroundColor $WarningColor
Start-Service -ServiceName "user-service" -Port "Dynamic" -Description "User Service"
Start-Sleep -Seconds 2

Start-Service -ServiceName "consultation-service" -Port "Dynamic" -Description "Consultation Service"
Start-Sleep -Seconds 2

Start-Service -ServiceName "lab-service" -Port "Dynamic" -Description "Lab Service"
Start-Sleep -Seconds 2

Start-Service -ServiceName "notification-service" -Port "Dynamic" -Description "Notification Service"

Pop-Location

Write-Host ""
Write-Host "============================================================================"
Write-Host "All services are starting..." -ForegroundColor $SuccessColor
Write-Host "============================================================================"
Write-Host ""
Write-Host "Service Details:" -ForegroundColor $InfoColor
Write-Host "  - Config Server:        http://localhost:8701"
Write-Host "  - Discovery Server:     http://localhost:8710"
Write-Host "  - API Gateway:          http://localhost:8700"
Write-Host "  - User Service:         (Dynamic port, check console)"
Write-Host "  - Consultation Service: (Dynamic port, check console)"
Write-Host "  - Lab Service:          (Dynamic port, check console)"
Write-Host "  - Notification Service: (Dynamic port, check console)"
Write-Host ""
Write-Host "Tips:" -ForegroundColor $InfoColor
Write-Host "  - Check service registration: http://localhost:8710"
Write-Host "  - Close console windows to stop individual services"
Write-Host "  - Run 'stop-all-services.bat' to stop all services"
Write-Host ""
Write-Host "Profile: $Profile" -ForegroundColor $WarningColor
Write-Host "============================================================================"
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor $WarningColor
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

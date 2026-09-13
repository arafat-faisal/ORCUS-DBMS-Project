# ============================================================================
# ORCUS Project - Development Environment Startup Script
# Starts both Backend (Go) and Frontend servers
# Platform: Windows PowerShell
# ============================================================================

[CmdletBinding()]
param (
    [int]$BackendPort = 5050,
    [int]$FrontendPort = 7700,
    [switch]$NoBrowser
)

function Show-Banner {
    Clear-Host
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host " ORCUS - Police Investigation & Case Tracking System" -ForegroundColor Cyan
    Write-Host " Development Environment Launcher" -ForegroundColor Cyan
    Write-Host " Authors: Faisal (241400060), Shakil (241400043), Liza (241400045)" -ForegroundColor DarkCyan
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-PortInUse([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Test-Prerequisites {
    Write-Host "[1/4] Checking prerequisites..." -ForegroundColor Yellow

    # Check Go
    $goInstalled = $null -ne (Get-Command go -ErrorAction SilentlyContinue)
    if (-not $goInstalled) {
        Write-Host "  [X] ERROR: Go is not installed or not in PATH." -ForegroundColor Red
        Write-Host "      Please install Go 1.19+ from https://golang.org/dl/" -ForegroundColor Yellow
        return $false
    }
    $goVersion = (go version)
    Write-Host "  [OK] Go detected: $goVersion" -ForegroundColor Green

    # Check Python
    $pythonInstalled = $null -ne (Get-Command python -ErrorAction SilentlyContinue)
    if (-not $pythonInstalled) {
        Write-Host "  [!] WARNING: Python not found (needed for standalone frontend server)." -ForegroundColor Yellow
    } else {
        $pyVersion = (python --version 2>&1)
        Write-Host "  [OK] Python detected: $pyVersion" -ForegroundColor Green
    }

    # Check MySQL Port (3306)
    $mysqlRunning = Test-PortInUse 3306
    if ($mysqlRunning) {
        Write-Host "  [OK] MySQL Server is active on port 3306" -ForegroundColor Green
    } else {
        Write-Host "  [!] WARNING: MySQL port 3306 does not appear active. Ensure MySQL/XAMPP is running." -ForegroundColor Yellow
    }

    Write-Host ""
    return $true
}

function Start-BackendServer([int]$Port = 5050) {
    Write-Host "[2/4] Starting Backend Server (Go)..." -ForegroundColor Yellow
    
    if (Test-PortInUse $Port) {
        Write-Host "  [!] Port $Port is already in use. Backend might already be running." -ForegroundColor Yellow
        return $true
    }

    Push-Location "backend"
    try {
        Write-Host "  Ensuring Go module dependencies..." -ForegroundColor Gray
        go mod download
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [X] Failed to download Go dependencies." -ForegroundColor Red
            return $false
        }

        Write-Host "  Launching Backend in a new window..." -ForegroundColor Gray
        Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "title ORCUS Backend (Port $Port) && go run ./cmd/server/main.go"
        Start-Sleep -Seconds 1
        Write-Host "  [OK] Backend Server started at http://localhost:$Port/api/v1" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }

    Write-Host ""
    return $true
}

function Start-FrontendServer([int]$Port = 9874) {
    Write-Host "[3/4] Starting Standalone Frontend Server..." -ForegroundColor Yellow

    if (Test-PortInUse $Port) {
        Write-Host "  [!] Port $Port is already in use." -ForegroundColor Yellow
        return $true
    }

    if (Test-Path "frontend/package.json") {
        Write-Host "  Launching Next.js App Router server on port $Port..." -ForegroundColor Gray
        Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "title ORCUS Next.js Frontend (Port $Port) && cd frontend && npm run dev -- -p $Port"
        Start-Sleep -Seconds 1
        Write-Host "  [OK] Next.js Frontend Server started at http://localhost:$Port" -ForegroundColor Green
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "title ORCUS Frontend (Port $Port) && cd frontend && python -m http.server $Port"
        Start-Sleep -Seconds 1
        Write-Host "  [OK] Frontend Server started at http://localhost:$Port" -ForegroundColor Green
    } else {
        Write-Host "  [!] Opening index.html directly in browser..." -ForegroundColor Yellow
        Start-Process (Resolve-Path "frontend/index.html")
    }

    Write-Host ""
    return $true
}

function Show-Summary([int]$bPort, [int]$fPort, [string]$Mode) {
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host " Services Ready!" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host " Mode:             $Mode" -ForegroundColor White
    Write-Host " Backend API:      http://localhost:$bPort/api/v1" -ForegroundColor Cyan
    Write-Host " Integrated UI:    http://localhost:$bPort" -ForegroundColor Cyan
    if ($fPort -gt 0) {
        Write-Host " Standalone UI:    http://localhost:$fPort" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host " Database:         127.0.0.1:3306 (orcus_db / user: root)" -ForegroundColor Gray
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""
}

# ----------------------------------------------------------------------------
# Main Execution Flow
# ----------------------------------------------------------------------------
Show-Banner

if (-not (Test-Prerequisites)) {
    exit 1
}

Write-Host "Choose startup configuration:" -ForegroundColor Yellow
Write-Host "  1) Full Stack (Backend on :$BackendPort + Standalone Frontend on :$FrontendPort) [Recommended]" -ForegroundColor Cyan
Write-Host "  2) Integrated Stack (Backend on :$BackendPort serves both API & UI)" -ForegroundColor Cyan
Write-Host "  3) Backend Only (Port :$BackendPort)" -ForegroundColor Cyan
Write-Host "  4) Standalone Frontend Only (Port :$FrontendPort)" -ForegroundColor Cyan
Write-Host "  5) Custom Frontend Port" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Enter choice (1-5, default: 1)"
if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

switch ($choice) {
    "1" {
        Start-BackendServer -Port $BackendPort
        Start-FrontendServer -Port $FrontendPort
        Show-Summary -bPort $BackendPort -fPort $FrontendPort -Mode "Full Stack (Backend + Standalone Frontend)"
        if (-not $NoBrowser) {
            Start-Process "http://localhost:$FrontendPort"
        }
    }
    "2" {
        Start-BackendServer -Port $BackendPort
        Show-Summary -bPort $BackendPort -fPort 0 -Mode "Integrated Backend & UI"
        if (-not $NoBrowser) {
            Start-Process "http://localhost:$BackendPort"
        }
    }
    "3" {
        Start-BackendServer -Port $BackendPort
        Show-Summary -bPort $BackendPort -fPort 0 -Mode "Backend Only"
    }
    "4" {
        Start-FrontendServer -Port $FrontendPort
        Show-Summary -bPort $BackendPort -fPort $FrontendPort -Mode "Frontend Only"
        if (-not $NoBrowser) {
            Start-Process "http://localhost:$FrontendPort"
        }
    }
    "5" {
        $customPortInput = Read-Host "Enter custom frontend port (1024-65535, e.g. 9874)"
        $customPort = 9874
        if ([int]::TryParse($customPortInput, [ref]$customPort) -and $customPort -ge 1 -and $customPort -le 65535) {
            Start-BackendServer -Port $BackendPort
            Start-FrontendServer -Port $customPort
            Show-Summary -bPort $BackendPort -fPort $customPort -Mode "Custom Frontend Port ($customPort)"
            if (-not $NoBrowser) {
                Start-Process "http://localhost:$customPort"
            }
        } else {
            Write-Host "Invalid port number. Defaulting to 9874." -ForegroundColor Yellow
            Start-BackendServer -Port $BackendPort
            Start-FrontendServer -Port 9874
            Show-Summary -bPort $BackendPort -fPort 9874 -Mode "Full Stack (Default Port 9874)"
            if (-not $NoBrowser) {
                Start-Process "http://localhost:9874"
            }
        }
    }
    default {
        Write-Host "Starting default Full Stack configuration..." -ForegroundColor Yellow
        Start-BackendServer -Port $BackendPort
        Start-FrontendServer -Port $FrontendPort
        Show-Summary -bPort $BackendPort -fPort $FrontendPort -Mode "Full Stack"
        if (-not $NoBrowser) {
            Start-Process "http://localhost:$FrontendPort"
        }
    }
}

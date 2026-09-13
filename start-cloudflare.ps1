<#
.SYNOPSIS
    ORCUS Investigation System - Cloudflare Tunnel Live Launcher
    Starts Go Backend (5050), Next.js Frontend (7700), and Cloudflare Tunnel
.PLATFORM
    Windows PowerShell 5.1+ / PowerShell Core
#>

[CmdletBinding()]
param (
    [int]$BackendPort = 5050,
    [int]$FrontendPort = 7700,
    [string]$TunnelName = ""
)

Clear-Host
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " ORCUS - Police Investigation System - Cloudflare Tunnel Launcher" -ForegroundColor Cyan
Write-Host " Authors: Faisal (241400060), Shakil (241400043), Liza (241400045)" -ForegroundColor DarkCyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Prerequisite checks
Write-Host "[1/4] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
    Write-Error "Go compiler not found in PATH."
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js / npm not found in PATH."
    exit 1
}
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Error "cloudflared CLI not found in PATH. Install with: winget install Cloudflare.cloudflared"
    exit 1
}
Write-Host "  [OK] All tools (Go, Node, Cloudflared) verified." -ForegroundColor Green
Write-Host ""

# 2. Start Backend
Write-Host "[2/4] Checking Go REST API Backend on port $BackendPort..." -ForegroundColor Yellow
$backendActive = Get-NetTCPConnection -LocalPort $BackendPort -State Listen -ErrorAction SilentlyContinue
if ($backendActive) {
    Write-Host "  [OK] Backend is ALREADY RUNNING on port $BackendPort. Skipping duplicate spawn." -ForegroundColor Green
} else {
    Start-Process cmd.exe -ArgumentList "/k title ORCUS Backend (:5050) && cd /d `"$PSScriptRoot\backend`" && go run ./cmd/server/main.go"
    Write-Host "  [OK] Backend starting at http://localhost:$BackendPort/api/v1" -ForegroundColor Green
}
Write-Host ""

# 3. Start Frontend
Write-Host "[3/4] Checking Next.js Frontend on port $FrontendPort..." -ForegroundColor Yellow
$frontendActive = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue
if ($frontendActive) {
    Write-Host "  [OK] Frontend is ALREADY RUNNING on port $FrontendPort. Skipping duplicate spawn." -ForegroundColor Green
} else {
    Start-Process cmd.exe -ArgumentList "/k title ORCUS Frontend (:7700) && cd /d `"$PSScriptRoot\frontend`" && npm run dev -- -p $FrontendPort"
    Write-Host "  [OK] Frontend starting at http://localhost:$FrontendPort" -ForegroundColor Green
}
Write-Host ""

# Wait for servers if needed
if (-not $frontendActive) {
    Write-Host "Waiting 4 seconds for services to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 4
}

# 4. Start Cloudflare Tunnel
Write-Host "[4/4] Starting Cloudflare Live Public Tunnel..." -ForegroundColor Yellow
if ($TunnelName -ne "") {
    Start-Process cmd.exe -ArgumentList "/k title ORCUS Cloudflare Live Public Tunnel && cloudflared tunnel run $TunnelName"
} else {
    Start-Process cmd.exe -ArgumentList "/k title ORCUS Cloudflare Live Public Tunnel && cloudflared tunnel --config NUL --url http://127.0.0.1:$FrontendPort"
}

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " System and Cloudflare Tunnel are now LIVE!" -ForegroundColor Green
Write-Host " Local Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host " Public URL:     Check the 'ORCUS Cloudflare Live Public Tunnel' window" -ForegroundColor White
Write-Host "                 for your https://....trycloudflare.com link." -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

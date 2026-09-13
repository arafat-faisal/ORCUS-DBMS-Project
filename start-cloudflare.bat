@echo off
REM ============================================================================
REM ORCUS Project - Cloudflare Tunnel Live Presentation Launcher
REM Starts Backend (Go on :5050), Next.js Frontend (:7700), and Cloudflare Tunnel
REM Platform: Windows CMD / Batch
REM ============================================================================

setlocal enabledelayedexpansion

set BACKEND_PORT=5050
set FRONTEND_PORT=7700

call :show_banner
call :check_prereqs
if errorlevel 1 goto :eof

echo Choose Tunnel configuration:
echo   1) Full Stack + Cloudflare Quick Tunnel (trycloudflare.com)
echo   2) Full Stack + Configured Cloudflare Tunnel (Named Tunnel)
echo   3) Full Stack + Instant Localtunnel (loca.lt - 100% Reliable Fallback) [Recommended]
echo   4) Tunnel Only (Expose already-running http://localhost:%FRONTEND_PORT%)
echo   5) Exit
echo.

set /p choice="Enter choice (1-5, default: 3): "
if "%choice%"=="" set choice=3

if "%choice%"=="1" (
    call :start_backend
    call :start_frontend %FRONTEND_PORT%
    echo Waiting 4 seconds for servers to initialize...
    timeout /t 4 /nobreak >nul
    call :start_quick_tunnel %FRONTEND_PORT%
    goto :launcher_exit
)

if "%choice%"=="2" (
    call :start_backend
    call :start_frontend %FRONTEND_PORT%
    echo Waiting 4 seconds for servers to initialize...
    timeout /t 4 /nobreak >nul
    set /p tunnel_name="Enter your configured Cloudflare Tunnel Name or UUID: "
    if "!tunnel_name!"=="" (
        echo [!] No tunnel name entered. Falling back to quick free tunnel...
        call :start_quick_tunnel %FRONTEND_PORT%
    ) else (
        call :start_configured_tunnel !tunnel_name!
    )
    goto :launcher_exit
)

if "%choice%"=="3" (
    call :start_backend
    call :start_frontend %FRONTEND_PORT%
    echo Waiting 4 seconds for servers to initialize...
    timeout /t 4 /nobreak >nul
    call :start_localtunnel %FRONTEND_PORT%
    goto :launcher_exit
)

if "%choice%"=="4" (
    call :start_localtunnel %FRONTEND_PORT%
    goto :launcher_exit
)

if "%choice%"=="5" (
    echo Exiting launcher.
    exit /b 0
)

REM Fallback to Option 1
call :start_backend
call :start_frontend %FRONTEND_PORT%
timeout /t 4 /nobreak >nul
call :start_quick_tunnel %FRONTEND_PORT%
goto :launcher_exit

REM ============================================================================
REM SUBROUTINES / FUNCTIONS
REM ============================================================================

:show_banner
cls
echo.
echo =====================================================================
echo  ORCUS - Police Investigation System - Live Cloudflare Tunnel
echo  Instant Public Presentation Launcher
echo  Authors: Faisal (241400060), Shakil (241400043), Liza (241400045)
echo =====================================================================
echo.
exit /b 0

:check_prereqs
echo [1/4] Checking system prerequisites...

where /q go
if errorlevel 1 (
    color 0C
    echo   [X] ERROR: Go is not installed or not in PATH
    pause
    exit /b 1
)
for /f "tokens=*" %%g in ('go version') do set GO_VER=%%g
echo   [OK] Go detected: !GO_VER!

where /q npm
if errorlevel 1 (
    color 0C
    echo   [X] ERROR: Node/npm is not installed or not in PATH
    pause
    exit /b 1
)
echo   [OK] Node/npm detected.

where /q cloudflared
if errorlevel 1 (
    color 0C
    echo   [X] ERROR: cloudflared is not installed or not in PATH
    echo       Please install it via: winget install Cloudflare.cloudflared
    pause
    exit /b 1
)
for /f "tokens=*" %%c in ('cloudflared --version 2^>^&1') do set CF_VER=%%c
echo   [OK] Cloudflare detected: !CF_VER!

echo.
exit /b 0

:start_backend
echo [2/4] Checking Backend Server (Go on port %BACKEND_PORT%)...
netstat -ano | findstr /R /C:":%BACKEND_PORT% .*LISTENING" >nul
if not errorlevel 1 (
    echo   [OK] Backend is ALREADY RUNNING on port %BACKEND_PORT%. Skipping duplicate spawn.
) else (
    cd backend
    start "ORCUS Backend Server (Port %BACKEND_PORT%)" cmd /k go run ./cmd/server/main.go
    echo   [OK] Backend Server launching at http://localhost:%BACKEND_PORT%/api/v1
    cd ..
)
echo.
exit /b 0

:start_frontend
set T_PORT=%~1
if "%T_PORT%"=="" set T_PORT=7700
echo [3/4] Checking Next.js Frontend Server (Port %T_PORT%)...
netstat -ano | findstr /R /C:":%T_PORT% .*LISTENING" >nul
if not errorlevel 1 (
    echo   [OK] Frontend is ALREADY RUNNING on port %T_PORT%. Skipping duplicate spawn.
) else (
    start "ORCUS Next.js Frontend (Port %T_PORT%)" cmd /k "cd frontend && npm run dev -- -p %T_PORT%"
    echo   [OK] Next.js Frontend Server launching at http://localhost:%T_PORT%
)
echo.
exit /b 0

:start_quick_tunnel
set P_PORT=%~1
if "%P_PORT%"=="" set P_PORT=7700
echo [4/4] Starting Cloudflare Quick Public Tunnel for http://localhost:%P_PORT%...
echo =====================================================================
echo  IMPORTANT: Cloudflared will print your public HTTPS URL below.
echo  Share that https://....trycloudflare.com link with your teacher!
echo =====================================================================
start "ORCUS Cloudflare Live Public Tunnel" cmd /k cloudflared tunnel --config NUL --url http://127.0.0.1:%P_PORT%
echo   [OK] Cloudflare tunnel launched in a dedicated terminal window.
echo.
exit /b 0

:start_localtunnel
set P_PORT=%~1
if "%P_PORT%"=="" set P_PORT=7700
echo [4/4] Starting Localtunnel Public HTTPS for http://localhost:%P_PORT%...
echo =====================================================================
echo  Localtunnel will output your instant public HTTPS URL!
echo =====================================================================
start "ORCUS Live Public Tunnel (loca.lt)" cmd /k npx -y localtunnel --port %P_PORT%
echo   [OK] Public tunnel launched.
echo.
exit /b 0

:launcher_exit
echo =====================================================================
echo  ORCUS System ^& Cloudflare Tunnel are now LIVE!
echo =====================================================================
echo  Local Frontend:   http://localhost:%FRONTEND_PORT%
echo  Local Backend:    http://localhost:%BACKEND_PORT%/api/v1
echo  Public Tunnel:    Look at the 'ORCUS Cloudflare Live Public Tunnel' window
echo                    for your https://....trycloudflare.com link.
echo =====================================================================
echo.
echo Press any key to close this launcher (all background services will remain running)...
pause >nul
exit /b 0

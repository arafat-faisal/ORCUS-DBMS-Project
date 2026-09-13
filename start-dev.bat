@echo off
REM ============================================================================
REM ORCUS Project - Development Environment Startup Script
REM Starts both Backend (Go) and Frontend servers
REM Platform: Windows CMD / Batch
REM ============================================================================

setlocal enabledelayedexpansion

set BACKEND_PORT=5050
set FRONTEND_PORT=7700

call :show_banner
call :check_prereqs
if errorlevel 1 goto :eof

echo Choose startup configuration:
echo   1) Full Stack (Backend on :%BACKEND_PORT% + Standalone Frontend on :%FRONTEND_PORT%) [Recommended]
echo   2) Integrated Stack (Backend on :%BACKEND_PORT% serves both API ^& UI)
echo   3) Backend Only (Port :%BACKEND_PORT%)
echo   4) Standalone Frontend Only (Port :%FRONTEND_PORT%)
echo   5) Custom Frontend Port
echo   6) Exit
echo.

set /p choice="Enter choice (1-6, default: 1): "
if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    call :start_backend
    call :start_frontend %FRONTEND_PORT%
    call :show_summary %BACKEND_PORT% %FRONTEND_PORT% "Full Stack"
    start http://localhost:%FRONTEND_PORT%
    goto :launcher_exit
)

if "%choice%"=="2" (
    call :start_backend
    call :show_summary %BACKEND_PORT% 0 "Integrated Backend and UI"
    start http://localhost:%BACKEND_PORT%
    goto :launcher_exit
)

if "%choice%"=="3" (
    call :start_backend
    call :show_summary %BACKEND_PORT% 0 "Backend Only"
    goto :launcher_exit
)

if "%choice%"=="4" (
    call :start_frontend %FRONTEND_PORT%
    call :show_summary 0 %FRONTEND_PORT% "Frontend Only"
    start http://localhost:%FRONTEND_PORT%
    goto :launcher_exit
)

if "%choice%"=="5" (
    set /p custom_port="Enter custom frontend port (e.g. 9874): "
    if "!custom_port!"=="" set custom_port=9874
    call :start_backend
    call :start_frontend !custom_port!
    call :show_summary %BACKEND_PORT% !custom_port! "Custom Frontend Port (!custom_port!)"
    start http://localhost:!custom_port!
    goto :launcher_exit
)

if "%choice%"=="6" (
    echo Exiting launcher.
    exit /b 0
)

REM Default fallback to Option 1
call :start_backend
call :start_frontend %FRONTEND_PORT%
call :show_summary %BACKEND_PORT% %FRONTEND_PORT% "Full Stack"
start http://localhost:%FRONTEND_PORT%
goto :launcher_exit

REM ============================================================================
REM SUBROUTINES / FUNCTIONS
REM ============================================================================

:show_banner
cls
echo.
echo =====================================================================
echo  ORCUS - Police Investigation ^& Case Tracking System
echo  Development Environment Launcher
echo  Authors: Faisal (241400060), Shakil (241400043), Liza (241400045)
echo =====================================================================
echo.
exit /b 0

:check_prereqs
echo [1/3] Checking prerequisites...

where /q go
if errorlevel 1 (
    color 0C
    echo   [X] ERROR: Go is not installed or not in PATH
    echo       Please install Go 1.19+ from https://golang.org/dl/
    pause
    exit /b 1
)
for /f "tokens=*" %%g in ('go version') do set GO_VER=%%g
echo   [OK] Go detected: !GO_VER!

where /q python
if errorlevel 1 (
    echo   [!] WARNING: Python not found (needed for standalone frontend server)
) else (
    for /f "tokens=*" %%p in ('python --version 2^>^&1') do set PY_VER=%%p
    echo   [OK] Python detected: !PY_VER!
)

echo.
exit /b 0

:start_backend
echo [2/3] Starting Backend Server (Go)...
cd backend
echo   Ensuring Go dependencies...
call go mod download
if errorlevel 1 (
    color 0C
    echo   [X] ERROR: Failed to download Go dependencies
    cd ..
    pause
    exit /b 1
)
start "ORCUS Backend Server (Port %BACKEND_PORT%)" cmd /k go run ./cmd/server/main.go
echo   [OK] Backend Server launching at http://localhost:%BACKEND_PORT%/api/v1
cd ..
echo.
exit /b 0

:start_frontend
set T_PORT=%~1
if "%T_PORT%"=="" set T_PORT=9874
echo [3/3] Starting Frontend Server (Port %T_PORT%)...

if exist "frontend\package.json" (
    echo   Starting Next.js App Router server on port %T_PORT%...
    start "ORCUS Next.js Frontend (Port %T_PORT%)" cmd /k "cd frontend && npm run dev -- -p %T_PORT%"
    echo   [OK] Next.js Frontend Server launching at http://localhost:%T_PORT%
) else if exist "frontend\index.html" (
    where /q python
    if errorlevel 1 (
        start frontend\index.html
    ) else (
        start "ORCUS Frontend Server (Port %T_PORT%)" cmd /k "cd frontend && python -m http.server %T_PORT%"
        echo   [OK] Frontend Server launching at http://localhost:%T_PORT%
    )
)
echo.
exit /b 0

:show_summary
set SB_PORT=%~1
set SF_PORT=%~2
set S_MODE=%~3
echo =====================================================================
echo  Services Ready!
echo =====================================================================
echo  Mode:             %S_MODE%
if not "%SB_PORT%"=="0" (
    echo  Backend API:      http://localhost:%SB_PORT%/api/v1
    echo  Integrated UI:    http://localhost:%SB_PORT%
)
if not "%SF_PORT%"=="0" (
    echo  Standalone UI:    http://localhost:%SF_PORT%
)
echo.
echo  Database:         127.0.0.1:3306 (orcus_db / user: root)
echo =====================================================================
echo.
exit /b 0

:launcher_exit
echo Both services are now running in their respective windows.
echo Press any key to close this launcher (services will remain running)...
pause >nul
exit /b 0

@echo off
echo ========================================
echo   SpendLens - Docker Development Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo Docker is running...
echo.
echo Starting SpendLens containers...
echo - PostgreSQL Database
echo - Backend API (port 3001)
echo - Frontend (port 5173)
echo.
echo This may take a few minutes on first run...
echo.

docker compose -f docker-compose.dev.yml up --build

pause

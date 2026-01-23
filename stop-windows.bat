@echo off
echo ========================================
echo   Stopping SpendLens Containers
echo ========================================
echo.

docker compose -f docker-compose.dev.yml down

echo.
echo All containers stopped!
echo.
pause

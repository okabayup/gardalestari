@echo off
echo ======================================
echo  Gardalestari Deploy Pipeline
echo ======================================
echo.

cd /d C:\dev\gardalestari

:: 1. Git push ke GitHub
echo [1/3] Push ke GitHub...
git add -A
git commit -m "deploy: %DATE% %TIME%" 2>nul || echo (no changes to commit)
git push origin main 2>&1 | tail -3
echo.

:: 2. Build Docker image lokal
echo [2/3] Build Docker image...
docker compose build --no-cache
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker build gagal!
    pause
    exit /b 1
)
echo.

:: 3. Restart container
echo [3/3] Restart container...
docker compose down 2>nul
docker compose up -d

echo.
echo ============================
echo  Deploy selesai!
echo  http://localhost:3000
echo ============================
pause

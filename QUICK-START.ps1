# CORTEXIA Quick Start - NO DATABASE REQUIRED
Write-Host "========================================" -ForegroundColor Green
Write-Host "   CORTEXIA Quick Start (Demo Mode)    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting in demo mode (no database needed)" -ForegroundColor Cyan
Write-Host ""

$scriptPath = $PSScriptRoot

# Start AI Engine first (lightest)
Write-Host "[1/2] Starting AI Engine..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\ai-models'; if (-not (Test-Path 'venv')) { python -m venv venv }; .\venv\Scripts\Activate.ps1; pip install fastapi uvicorn pydantic scikit-learn numpy pandas -q; `$env:PYTHONPATH='$scriptPath\ai-models'; Write-Host 'AI Engine starting on port 8000...' -ForegroundColor Green; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 3

# Start Frontend (can work without backend for UI testing)
Write-Host "[2/2] Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend'; if (-not (Test-Path 'node_modules')) { npm install -q }; if (-not (Test-Path '.env')) { `$env = 'VITE_API_URL=http://localhost:5000/api`nVITE_SOCKET_URL=http://localhost:5000`nVITE_AI_API_URL=http://localhost:8000`nVITE_APP_NAME=CORTEXIA'; `$env | Out-File '.env' -Encoding UTF8 }; Write-Host 'Frontend starting on port 3000...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SERVICES STARTING...                " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait 30-60 seconds..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  - Frontend:  http://localhost:3000 (UI Only)" -ForegroundColor Cyan
Write-Host "  - AI Engine: http://localhost:8000 (API)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Backend requires PostgreSQL (not started)" -ForegroundColor Yellow
Write-Host "You can test the UI design and components" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening browser in 20 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 20

Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Browser opened! Check the windows above." -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

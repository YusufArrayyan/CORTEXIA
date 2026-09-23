# CORTEXIA Complete Startup Script
# This will start all services in separate windows

Write-Host "========================================" -ForegroundColor Green
Write-Host "   STARTING CORTEXIA APPLICATION       " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$scriptPath = $PSScriptRoot

Write-Host "Starting services..." -ForegroundColor Cyan
Write-Host ""

# Start Backend in new window
Write-Host "[1/3] Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\start-backend.ps1"
Start-Sleep -Seconds 2

# Start AI Engine in new window
Write-Host "[2/3] Starting AI Engine..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\start-ai-engine.ps1"
Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "[3/3] Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptPath\start-frontend.ps1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ALL SERVICES STARTING...            " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait 30-60 seconds for all services to start" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services will be available at:" -ForegroundColor White
Write-Host "  - Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "  - AI Engine: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Accounts:" -ForegroundColor White
Write-Host "  Student: student@cortexia.id / student123" -ForegroundColor Yellow
Write-Host "  Teacher: teacher@cortexia.id / teacher123" -ForegroundColor Yellow
Write-Host "  Parent:  parent@cortexia.id / parent123" -ForegroundColor Yellow
Write-Host "  Admin:   admin@cortexia.id / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening browser in 15 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Open browser
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

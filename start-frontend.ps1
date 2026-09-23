# CORTEXIA Frontend Startup Script
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CORTEXIA Frontend Starting...  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location -Path "$PSScriptRoot\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies... (this may take a few minutes)" -ForegroundColor Yellow
    npm install
}

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000

VITE_APP_NAME=CORTEXIA
VITE_APP_VERSION=1.0.0

VITE_ENABLE_GAZE_TRACKING=true
VITE_ENABLE_SPEECH_RECOGNITION=true
VITE_DEBUG_MODE=true
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Frontend starting on port 3000 " -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start the server
npm run dev

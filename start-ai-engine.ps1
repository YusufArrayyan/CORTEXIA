# CORTEXIA AI Engine Startup Script
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CORTEXIA AI Engine Starting... " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to ai-models directory
Set-Location -Path "$PSScriptRoot\ai-models"

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Check if packages are installed
if (-not (Test-Path "venv\Lib\site-packages\fastapi")) {
    Write-Host "Installing Python packages... (this may take a few minutes)" -ForegroundColor Yellow
    pip install --upgrade pip
    pip install -r requirements.txt
}

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
ENVIRONMENT=development
PORT=8000
LOG_LEVEL=INFO

# Model paths
MODEL_PATH=./models
GAZE_MODEL_PATH=./models/gaze_model.joblib
SPEECH_MODEL_PATH=./models/speech_model.joblib
MULTIMODAL_MODEL_PATH=./models/multimodal_model.joblib
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
}

# Create models directory if not exists
if (-not (Test-Path "models")) {
    New-Item -ItemType Directory -Path "models" -Force | Out-Null
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  AI Engine starting on port 8000" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "API will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Swagger docs at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

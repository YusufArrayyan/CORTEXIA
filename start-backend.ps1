# CORTEXIA Backend Startup Script
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  CORTEXIA Backend Starting...   " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies... (this may take a few minutes)" -ForegroundColor Yellow
    npm install
}

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
NODE_ENV=development
PORT=5000

# Database (use your PostgreSQL credentials)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cortexia_dev

# JWT Secrets
JWT_SECRET=dev_jwt_secret_key_minimum_32_characters_long_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_minimum_32_characters_long_change_in_production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis (optional - will work without it)
REDIS_URL=redis://localhost:6379

# MongoDB (optional - will work without it)
MONGODB_URL=mongodb://localhost:27017/cortexia_analytics

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# AI Service
AI_SERVICE_URL=http://localhost:8000
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
}

Write-Host ""
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  Backend starting on port 5000  " -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "API will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run dev

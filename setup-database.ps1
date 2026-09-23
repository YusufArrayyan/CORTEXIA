# CORTEXIA Database Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CORTEXIA Database Setup             " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
try {
    $pgVersion = psql --version
    Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""
Write-Host "Creating database..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please enter your PostgreSQL password when prompted" -ForegroundColor Cyan
Write-Host "(Default is usually 'postgres')" -ForegroundColor Gray
Write-Host ""

# Create database
$createDbCommand = @"
CREATE DATABASE cortexia_dev;
"@

$createDbCommand | psql -U postgres -h localhost -p 5432

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database created successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Note: Database may already exist (this is OK)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Database Setup Complete             " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run: .\START-ALL.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

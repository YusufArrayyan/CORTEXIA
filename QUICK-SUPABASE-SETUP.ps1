# ========================================
# CORTEXIA - Quick Supabase Setup Script
# ========================================

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 CORTEXIA SUPABASE QUICK SETUP 🚀           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Step 1: Check if user has Supabase credentials
Write-Host "📋 LANGKAH 1: Setup Supabase Project" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Apakah Anda sudah punya project Supabase?" -ForegroundColor White
Write-Host "  [1] Belum - Saya perlu panduan lengkap" -ForegroundColor Cyan
Write-Host "  [2] Sudah - Saya punya URL dan API Key" -ForegroundColor Green
Write-Host ""

$choice = Read-Host "Pilih (1/2)"

if ($choice -eq "1") {
    Write-Host "`n✅ Membuka panduan Supabase setup..." -ForegroundColor Green
    Write-Host "`n📖 File panduan: SUPABASE_SETUP.md" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
    
    Write-Host "RINGKASAN SETUP:" -ForegroundColor Cyan
    Write-Host "1. Buka https://supabase.com" -ForegroundColor White
    Write-Host "2. Sign up / Login" -ForegroundColor White
    Write-Host "3. Create New Project (nama: CORTEXIA)" -ForegroundColor White
    Write-Host "4. Tunggu 2 menit project selesai dibuat" -ForegroundColor White
    Write-Host "5. Copy Project URL dan anon key" -ForegroundColor White
    Write-Host "6. Jalankan script ini lagi dan pilih [2]`n" -ForegroundColor White
    
    Write-Host "Tekan Enter untuk membuka browser ke Supabase..." -ForegroundColor Yellow
    Read-Host
    Start-Process "https://supabase.com"
    
    Write-Host "`n📄 Membuka file panduan lengkap..." -ForegroundColor Green
    notepad.exe "SUPABASE_SETUP.md"
    
    exit
}

# Step 2: Input credentials
Write-Host "`n📝 LANGKAH 2: Masukkan Supabase Credentials" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

$supabaseUrl = Read-Host "Supabase URL (https://xxxxx.supabase.co)"
$supabaseKey = Read-Host "Supabase anon key"

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "`n❌ Error: URL dan Key tidak boleh kosong!" -ForegroundColor Red
    exit
}

# Step 3: Create .env files
Write-Host "`n📝 LANGKAH 3: Membuat .env files..." -ForegroundColor Yellow

# Backend .env
$backendEnv = @"
# CORTEXIA Backend Environment Variables
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000

# Supabase
SUPABASE_URL=$supabaseUrl
SUPABASE_ANON_KEY=$supabaseKey

# JWT
JWT_SECRET=cortexia-secret-key-2024

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
"@

$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
Write-Host "✅ Created: backend\.env" -ForegroundColor Green

# Frontend .env
$frontendEnv = @"
# CORTEXIA Frontend Environment Variables
VITE_SUPABASE_URL=$supabaseUrl
VITE_SUPABASE_ANON_KEY=$supabaseKey
VITE_API_URL=http://localhost:5000
"@

$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8
Write-Host "✅ Created: frontend\.env" -ForegroundColor Green

# Step 4: Database Schema
Write-Host "`n📊 LANGKAH 4: Database Schema" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Sekarang Anda perlu membuat tabel di Supabase:" -ForegroundColor White
Write-Host "1. Buka Supabase dashboard di browser" -ForegroundColor Cyan
Write-Host "2. Klik 'SQL Editor' di sidebar" -ForegroundColor Cyan
Write-Host "3. Copy-paste SQL dari file SUPABASE_SETUP.md" -ForegroundColor Cyan
Write-Host "4. Klik 'Run' untuk execute`n" -ForegroundColor Cyan

Write-Host "Apakah Anda sudah run SQL schema?" -ForegroundColor Yellow
Write-Host "  [1] Belum - Buka SQL Editor sekarang" -ForegroundColor Cyan
Write-Host "  [2] Sudah - Lanjutkan ke testing" -ForegroundColor Green
Write-Host ""

$sqlChoice = Read-Host "Pilih (1/2)"

if ($sqlChoice -eq "1") {
    Write-Host "`n🌐 Membuka Supabase SQL Editor..." -ForegroundColor Green
    Start-Process "$supabaseUrl/editor"
    
    Write-Host "`n📄 Membuka file dengan SQL schema..." -ForegroundColor Green
    notepad.exe "SUPABASE_SETUP.md"
    
    Write-Host "`n⏸️  Script di-pause. Tekan Enter setelah SQL berhasil di-run..." -ForegroundColor Yellow
    Read-Host
}

# Step 5: Restart services
Write-Host "`n🔄 LANGKAH 5: Restart Services" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Menghentikan proses lama..." -ForegroundColor Gray
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Services stopped`n" -ForegroundColor Green

Write-Host "Apakah Anda ingin start services sekarang?" -ForegroundColor Yellow
Write-Host "  [Y] Ya - Start frontend & backend" -ForegroundColor Green
Write-Host "  [N] Tidak - Saya akan start manual" -ForegroundColor Gray
Write-Host ""

$startChoice = Read-Host "Pilih (Y/N)"

if ($startChoice -eq "Y" -or $startChoice -eq "y") {
    Write-Host "`n🚀 Starting services..." -ForegroundColor Green
    
    Write-Host "`nℹ️  Backend akan running di: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "ℹ️  Frontend akan running di: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`n⚠️  Tunggu ~10 detik untuk startup...`n" -ForegroundColor Yellow
    
    # Start in new windows
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Starting Backend...' -ForegroundColor Green; npm start"
    Start-Sleep -Seconds 2
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Starting Frontend...' -ForegroundColor Green; npm run dev"
    
    Start-Sleep -Seconds 8
    
    Write-Host "✅ Services started!" -ForegroundColor Green
    Write-Host "`n🌐 Membuka browser..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:3000"
}

# Done
Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            ✅ SUPABASE SETUP COMPLETE! ✅           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📌 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Buka http://localhost:3000" -ForegroundColor White
Write-Host "  2. Klik 'Register' untuk buat akun" -ForegroundColor White
Write-Host "  3. Login dan mulai assessment" -ForegroundColor White
Write-Host "  4. Data tersimpan di Supabase cloud!`n" -ForegroundColor White

Write-Host "📚 Dokumentasi: SUPABASE_SETUP.md" -ForegroundColor Gray
Write-Host "🔧 Environment files: backend\.env & frontend\.env`n" -ForegroundColor Gray

Write-Host "Tekan Enter untuk keluar..." -ForegroundColor Yellow
Read-Host

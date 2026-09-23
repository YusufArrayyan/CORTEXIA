# 🚀 Quick Start Guide - CORTEXIA

## 📋 Prerequisites

Pastikan sudah terinstall:
- ✅ Node.js 18+ (Download: https://nodejs.org/)
- ✅ Python 3.11+ (Download: https://www.python.org/)
- ✅ PostgreSQL 15+ (Download: https://www.postgresql.org/download/windows/)

---

## 🎯 Cara Menjalankan (3 Langkah Mudah)

### **LANGKAH 1: Setup Database (SEKALI AJA)**

Klik kanan pada file `setup-database.ps1` → Run with PowerShell

**ATAU** buka PowerShell di folder ini dan ketik:
```powershell
.\setup-database.ps1
```

Masukkan password PostgreSQL (biasanya: `postgres`)

---

### **LANGKAH 2: Start Semua Service**

**CARA TERCEPAT** - Klik kanan pada file `START-ALL.ps1` → Run with PowerShell

**ATAU** buka PowerShell dan ketik:
```powershell
.\START-ALL.ps1
```

Ini akan membuka 3 window PowerShell:
- 🟦 Window 1: Backend (port 5000)
- 🟩 Window 2: AI Engine (port 8000)  
- 🟨 Window 3: Frontend (port 3000)

---

### **LANGKAH 3: Buka Browser**

Browser akan otomatis terbuka ke: **http://localhost:3000**

Jika tidak, buka manual: http://localhost:3000

---

## 🔐 Demo Accounts

Login dengan akun berikut:

```
👨‍🎓 STUDENT (Siswa)
Email: student@cortexia.id
Password: student123

👨‍🏫 TEACHER (Guru)
Email: teacher@cortexia.id
Password: teacher123

👨‍👩‍👧 PARENT (Orang Tua)
Email: parent@cortexia.id
Password: parent123

👤 ADMIN
Email: admin@cortexia.id
Password: admin123
```

---

## 🎮 Test Flow

1. Login sebagai **Student**
2. Klik **"Ambil Latihan"** atau **"Take Assessment"**
3. Ikuti calibration (ikuti titik-titik di layar)
4. Baca teks yang muncul
5. Lihat hasil assessment

---

## 🛑 Cara Stop

**Close semua window PowerShell** yang terbuka ATAU tekan **Ctrl+C** di setiap window.

---

## 🐛 Troubleshooting

### ❌ "Port already in use"
```powershell
# Cek siapa yang pakai port
netstat -ano | findstr :5000
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Kill process (ganti <PID> dengan nomor yang muncul)
taskkill /PID <PID> /F
```

### ❌ "PostgreSQL connection failed"
- Pastikan PostgreSQL service running
- Cek Windows Services → PostgreSQL
- Atau restart PostgreSQL

### ❌ "npm not found" atau "python not found"
- Install Node.js dan Python
- Restart PowerShell setelah install

### ❌ Script execution policy error
Jalankan PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📂 File Structure

```
CORTEXIA/
├── START-ALL.ps1          ← JALANKAN INI untuk start semua
├── setup-database.ps1     ← Setup database (sekali aja)
├── start-backend.ps1      ← Backend saja
├── start-ai-engine.ps1    ← AI Engine saja
├── start-frontend.ps1     ← Frontend saja
├── backend/               ← Backend code
├── ai-models/             ← AI Engine code
├── frontend/              ← Frontend code
└── docs/                  ← Documentation
```

---

## 🎯 URL Services

- **Frontend (UI)**: http://localhost:3000
- **Backend (API)**: http://localhost:5000
- **Backend Health**: http://localhost:5000/health
- **AI Engine (API)**: http://localhost:8000
- **AI Engine Docs**: http://localhost:8000/docs

---

## 📝 Development

### Start Individual Services

```powershell
# Backend only
.\start-backend.ps1

# AI Engine only  
.\start-ai-engine.ps1

# Frontend only
.\start-frontend.ps1
```

### Run Tests

```powershell
# Backend tests
cd backend
npm test

# AI Engine tests
cd ai-models
.\venv\Scripts\Activate
pytest

# Frontend tests
cd frontend
npm test
```

---

## 💡 Tips

1. **Pertama kali start** mungkin butuh waktu 2-3 menit (download packages)
2. **Jangan close window PowerShell** saat aplikasi running
3. **Gunakan Chrome** untuk best experience (gaze tracking)
4. **Allow camera & microphone** access saat diminta

---

## 🆘 Need Help?

1. Check: `docs/TESTING_STRATEGY.md`
2. Check: `docs/DEPLOYMENT_GUIDE.md`
3. Check: `COMPLETION_SUMMARY.md`

---

## ✅ Success Indicators

Semua service running jika Anda lihat:
- ✓ Backend: "Server running on port 5000"
- ✓ AI Engine: "Uvicorn running on http://0.0.0.0:8000"
- ✓ Frontend: "Local: http://localhost:3000"
- ✓ Browser terbuka ke localhost:3000

---

**ENJOY TESTING! 🎉**

# CORTEXIA - Setup & Running Guide

## 🎨 Frontend Redesign - COMPLETED ✅

Frontend sudah berhasil didesign ulang mengikuti referensi design dari:
- CORTEXIA - Fitur Pelafalan
- Container
- CORTEXIA PROTOTYPE

### Yang Sudah Selesai:

✅ **Theme System** - Orange (#F89847), Navy (#1E2B5F), Purple (#6366F1)
✅ **Component Library** - 20+ reusable components
✅ **Landing Page** - Hero, Features, CTA dengan maskot CORTI
✅ **Login Page** - Design baru dengan logo asli
✅ **Register Page** - Konsisten dengan design system
✅ **Global Styles** - CSS variables, animations, utilities
✅ **Logo CORTEXIA** - Maskot jeruk yang asli dari SVG.png

### Files Created/Modified:

**New Files:**
- `frontend/src/theme.ts` - Updated theme
- `frontend/src/styles/cortexia.css` - Global styles
- `frontend/src/components/common/CortexiaComponents.tsx` - Component library
- `frontend/src/pages/LandingPage.tsx` - Redesigned
- `frontend/src/pages/student/PronunciationPractice.tsx`
- `frontend/src/pages/student/WelcomeScreen.tsx`
- `frontend/src/pages/student/StudentDashboardRedesign.tsx`
- `frontend/src/pages/student/TakeAssessmentRedesign.tsx`
- `frontend/src/pages/DemoPage.tsx`
- `frontend/DESIGN_SYSTEM.md` - Complete documentation
- `frontend/REDESIGN_README.md` - Usage guide
- `frontend/REDESIGN_SUMMARY.md` - Summary

**Assets:**
- `frontend/public/logo-cortexia.png` - Logo asli
- `frontend/public/corti-mascot.png` - Maskot CORTI

---

## 🚀 How to Run

### 1. Frontend (Already Running ✅)

Frontend sudah berjalan di **http://localhost:3001/**

```powershell
# Terminal 1 - Frontend
cd c:\CAPSTONE\CORTEXIA\frontend
npm run dev
```

**Access:**
- Landing Page: http://localhost:3001/
- Login: http://localhost:3001/login
- Register: http://localhost:3001/register

### 2. Backend (Manual Start Required)

Backend perlu troubleshooting untuk database connection.

```powershell
# Terminal 2 - Backend
cd c:\CAPSTONE\CORTEXIA\backend
npm start
```

**Expected Port:** http://localhost:5000

### 3. AI Models (Optional)

```powershell
# Terminal 3 - AI Engine
cd c:\CAPSTONE\CORTEXIA\ai-models
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**Expected Port:** http://localhost:8000

---

## 🔧 Backend Troubleshooting

### Issue: Backend tidak start atau crash

**Kemungkinan masalah:**

1. **Database Connection Issue**
   - Supabase credentials mungkin salah
   - Database tidak accessible
   
2. **Missing Dependencies**
   ```powershell
   cd c:\CAPSTONE\CORTEXIA\backend
   npm install
   ```

3. **Port sudah digunakan**
   ```powershell
   # Check if port 5000 is used
   netstat -ano | findstr :5000
   ```

4. **Environment Variables**
   - Cek file `.env` di backend folder
   - Pastikan SUPABASE_URL dan keys sudah benar

### Fix Steps:

**Step 1: Verify Supabase Connection**
```powershell
cd c:\CAPSTONE\CORTEXIA\backend
node
```

Kemudian di Node REPL:
```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('Connected:', supabase);
```

**Step 2: Test Simple Server**

Create `test-server.js`:
```javascript
require('dotenv').config();
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

Run:
```powershell
node test-server.js
```

---

## 📱 Demo Mode (No Backend Needed)

Anda bisa melihat redesign tanpa backend:

1. **Landing Page** - Fully functional
2. **Login Page** - UI sudah selesai (backend needed untuk auth)
3. **Register Page** - UI sudah selesai (backend needed untuk auth)

Demo accounts tertera di Login page untuk reference.

---

## 🎯 Demo Accounts (From Supabase)

```
Student:  student@cortexia.id  / password123
Teacher:  teacher@cortexia.id  / password123
Admin:    admin@cortexia.id    / password123
```

---

## 📚 Documentation

Full documentation tersedia di:

1. **Design System**: `frontend/DESIGN_SYSTEM.md`
2. **Redesign Guide**: `frontend/REDESIGN_README.md`
3. **Summary**: `frontend/REDESIGN_SUMMARY.md`

---

## ✨ What's New in Redesign

### Colors
- **Primary**: Orange #F89847 (brand color)
- **Secondary**: Purple #6366F1 / Navy #1E2B5F
- **Success**: #10B981
- **Background**: Soft gradients

### Typography
- **Primary Font**: Outfit (rounded, friendly)
- **Secondary Font**: Poppins (clean, geometric)
- **Font Weights**: 400-900

### Components
20+ reusable components:
- Buttons (Primary, Secondary, Outline, Icon, FAB)
- Cards (Standard, Interactive, Success, Glass)
- Badges & Chips
- Progress Bars
- Decorative Shapes
- Animations

### Pages
- Landing Page (Hero + Features + CTA)
- Login (with logo and demo accounts)
- Register (consistent design)
- Pronunciation Practice (new)
- Welcome Screen (new)
- Dashboard Redesign (new)
- Assessment Interface (new)

---

## 🐛 Known Issues

1. **Backend not starting** - Database connection needs troubleshooting
2. **"Failed to fetch" on login** - Normal, backend not running yet
3. **Demo mode only** - Full functionality requires backend

---

## 📞 Next Steps

1. ✅ Frontend Redesign - **DONE**
2. ⚠️ Fix Backend Connection - **NEEDS WORK**
3. 🔄 Integrate Backend APIs
4. 🎨 Complete Teacher & Admin Dashboards
5. 🧪 Testing & Bug Fixes
6. 🚀 Production Deployment

---

## 💡 Tips

- **See the redesign**: Just open http://localhost:3001/
- **Explore design system**: Check `DESIGN_SYSTEM.md`
- **Use components**: Import from `CortexiaComponents.tsx`
- **Match the style**: Follow theme colors and spacing

---

**Created**: 2026
**Status**: Frontend Redesign Complete ✅
**Next**: Backend Connection Fix

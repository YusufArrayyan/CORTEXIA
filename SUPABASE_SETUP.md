# 🚀 CORTEXIA - Supabase Setup Guide

## 📋 Langkah Setup Supabase

### 1️⃣ Buat Project Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Sign up / Login dengan GitHub
3. Klik **"New Project"**
4. Isi detail project:
   - **Name:** CORTEXIA
   - **Database Password:** (buat password yang kuat)
   - **Region:** Southeast Asia (Singapore) - terdekat dengan Indonesia
5. Klik **"Create new project"**
6. Tunggu ~2 menit project selesai dibuat

---

### 2️⃣ Dapatkan API Keys

1. Di dashboard Supabase, klik **Settings** (⚙️) di sidebar
2. Klik **API**
3. Copy 2 keys ini:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** Key yang panjang (mulai dengan `eyJ...`)

---

### 3️⃣ Setup Environment Variables

#### **Backend (.env)**

Buat file `.env` di folder `backend/`:

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Config
NODE_ENV=development
PORT=5000
JWT_SECRET=cortexia-secret-key-2024
FRONTEND_URL=http://localhost:3000
AI_ENGINE_URL=http://localhost:8000
```

#### **Frontend (.env)**

Buat file `.env` di folder `frontend/`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:5000
```

---

### 4️⃣ Buat Database Schema

Di Supabase dashboard, klik **SQL Editor**, lalu run SQL ini:

```sql
-- ========================================
-- CORTEXIA DATABASE SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'PARENT', 'ADMIN')),
  grade_level INTEGER,
  school_name TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading texts table
CREATE TABLE reading_texts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD')),
  grade_level INTEGER NOT NULL,
  language TEXT DEFAULT 'id',
  word_count INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text_id UUID REFERENCES reading_texts(id) ON DELETE CASCADE,
  gaze_data JSONB,
  speech_data JSONB,
  ai_score DECIMAL(5,2),
  difficulty_level TEXT,
  reading_speed INTEGER,
  accuracy_score DECIMAL(5,2),
  comprehension_score DECIMAL(5,2),
  recommendations TEXT[],
  status TEXT DEFAULT 'COMPLETED',
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_level TEXT,
  total_assessments INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  strengths TEXT[],
  weaknesses TEXT[],
  last_assessment_date TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- RLS Policies for reading_texts (public read)
CREATE POLICY "Anyone can read texts" 
  ON reading_texts FOR SELECT 
  TO authenticated 
  USING (true);

-- RLS Policies for assessments
CREATE POLICY "Users can view own assessments" 
  ON assessments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" 
  ON assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for progress
CREATE POLICY "Users can view own progress" 
  ON user_progress FOR SELECT 
  USING (auth.uid() = user_id);

-- Insert sample reading texts
INSERT INTO reading_texts (title, content, difficulty_level, grade_level, word_count) VALUES
('Kucing Kesayangan', 'Aku memiliki seekor kucing. Namanya Mimi. Mimi sangat lucu dan menggemaskan. Bulunya berwarna putih dan lembut. Setiap pagi, Mimi selalu menyambutku dengan suara menggemaskan.', 'EASY', 1, 28),
('Perjalanan ke Pantai', 'Liburan kemarin, keluargaku pergi ke pantai. Pantainya sangat indah dengan pasir putih dan air laut yang jernih. Aku bermain pasir dan berenang bersama kakak. Kami sangat senang dan tidak sabar untuk kembali lagi.', 'MEDIUM', 3, 35),
('Teknologi dan Masa Depan', 'Perkembangan teknologi di era digital saat ini sangat pesat. Artificial Intelligence dan machine learning telah mengubah cara manusia bekerja dan berinteraksi. Namun, kita harus bijak dalam menggunakan teknologi agar memberikan manfaat maksimal bagi kehidupan.', 'HARD', 6, 38);

```

Klik **Run** untuk execute SQL.

---

### 5️⃣ Test Connection

Restart backend dan frontend:

```powershell
# Di PowerShell, folder CORTEXIA

# Stop semua process
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start backend
cd backend
npm start

# Start frontend (terminal baru)
cd frontend
npm run dev
```

Cek console - Anda akan melihat:
```
✅ Supabase connected successfully
```

---

### 6️⃣ Enable Authentication

Di Supabase dashboard:

1. Klik **Authentication** di sidebar
2. Klik **Providers**
3. Enable **Email provider**
4. **Disable** "Confirm email" untuk testing (opsional)
5. Save

---

## 🎯 Fitur Supabase yang Digunakan

- ✅ **PostgreSQL Database** - Cloud database tanpa install lokal
- ✅ **Authentication** - User sign up/login built-in
- ✅ **Row Level Security** - Data privacy per user
- ✅ **Real-time** - Live updates (optional)
- ✅ **Storage** - File upload untuk audio/gambar (optional)
- ✅ **Edge Functions** - Serverless functions (optional)

---

## 📊 Testing

Setelah setup:

1. Buka `http://localhost:3000`
2. Klik **Register** untuk buat akun baru
3. Login dengan akun tersebut
4. Mulai assessment

Data akan tersimpan di Supabase cloud database!

---

## 🔗 Useful Links

- **Supabase Dashboard:** [https://app.supabase.com](https://app.supabase.com)
- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase JS Client:** [https://supabase.com/docs/reference/javascript](https://supabase.com/docs/reference/javascript)

---

## 💡 Tips

1. **Free Tier:** 500MB database, 2GB bandwidth/month
2. **Paused Projects:** Inactive projects di-pause otomatis setelah 1 minggu (tinggal un-pause di dashboard)
3. **Backup:** Supabase auto-backup setiap hari
4. **Security:** Jangan commit `.env` ke git!
5. **Production:** Upgrade ke paid plan untuk production apps

---

## 🆘 Troubleshooting

**Error: "Invalid API key"**
- Check `.env` file sudah benar
- Restart backend & frontend

**Error: "relation users does not exist"**
- Run SQL schema di SQL Editor

**Error: "CORS"**
- Check `FRONTEND_URL` di `.env` backend

---

**Selamat! CORTEXIA sekarang menggunakan Supabase! 🎉**

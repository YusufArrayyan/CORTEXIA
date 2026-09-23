# 🚀 Cara Run SQL Schema di Supabase

## 📋 Quick Steps:

### 1️⃣ Buka SQL Editor di Supabase
- Buka dashboard Supabase: https://app.supabase.com
- Pilih project **CORTEXIA**
- Klik **SQL Editor** di sidebar kiri (icon ⚡)

### 2️⃣ Create New Query
- Klik tombol **"New query"** atau **"+"** 
- Akan muncul editor kosong

### 3️⃣ Copy SQL Schema
- Buka file: `C:\CAPSTONE\CORTEXIA\supabase-schema.sql`
- **Select All** (Ctrl+A) dan **Copy** (Ctrl+C)

### 4️⃣ Paste & Run
- Paste SQL di SQL Editor Supabase (Ctrl+V)
- Klik tombol **"Run"** (atau tekan Ctrl+Enter)
- Tunggu ~5-10 detik sampai selesai

### 5️⃣ Verify Success ✅
Setelah run, Anda akan melihat pesan:
```
✅ CORTEXIA Database Schema Created Successfully!

📊 Tables Created:
   - users
   - reading_texts
   - assessments
   - user_progress

🔒 Row Level Security Enabled
✅ Sample Reading Texts Inserted (6 texts)

🚀 Ready to use with CORTEXIA!
```

---

## 🔍 Verify Tables Created

### Option 1: Table Editor
1. Klik **Table Editor** di sidebar
2. Anda akan melihat 4 tables:
   - `users`
   - `reading_texts` (dengan 6 sample texts)
   - `assessments`
   - `user_progress`

### Option 2: Run Query
Di SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 📊 What Was Created:

### Tables:
1. **users** - User profiles (student, teacher, admin, parent)
2. **reading_texts** - Teks bacaan dengan level kesulitan
3. **assessments** - Hasil assessment (gaze tracking, speech analysis, AI scores)
4. **user_progress** - Tracking kemajuan belajar siswa

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Teachers/Admins can view all assessments
- ✅ Public read access for reading_texts (authenticated users only)

### Sample Data:
- ✅ 6 reading texts inserted:
  - 2 EASY level (grade 1-2)
  - 2 MEDIUM level (grade 3-4)
  - 2 HARD level (grade 5-6)

---

## ⚠️ Troubleshooting

### Error: "relation already exists"
**Solution:** Tables sudah ada, skip atau drop dulu:
```sql
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS reading_texts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
Lalu run schema lagi.

### Error: "permission denied"
**Solution:** Pastikan Anda login sebagai Owner project.

### Error: "syntax error"
**Solution:** Pastikan copy-paste SQL lengkap dari awal sampai akhir file.

---

## 🎯 Next Steps After SQL Success:

1. ✅ Restart backend & frontend
2. ✅ Test Supabase connection
3. ✅ Register user baru di http://localhost:3000
4. ✅ Start assessment
5. ✅ Data tersimpan di Supabase! 🎉

---

**File SQL:** `C:\CAPSTONE\CORTEXIA\supabase-schema.sql`

**Ready to run!** 🚀

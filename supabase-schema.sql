-- ========================================
-- CORTEXIA DATABASE SCHEMA FOR SUPABASE
-- ========================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS users (
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

-- ========================================
-- READING TEXTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS reading_texts (
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

-- ========================================
-- ASSESSMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS assessments (
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

-- ========================================
-- USER PROGRESS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_progress (
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

-- ========================================
-- CREATE INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_progress(user_id);

-- ========================================
-- ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- ========================================
-- RLS POLICIES FOR USERS
-- ========================================
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" 
  ON users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ========================================
-- RLS POLICIES FOR READING TEXTS
-- ========================================
DROP POLICY IF EXISTS "Anyone can read texts" ON reading_texts;
CREATE POLICY "Anyone can read texts" 
  ON reading_texts FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Teachers can insert texts" ON reading_texts;
CREATE POLICY "Teachers can insert texts" 
  ON reading_texts FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('TEACHER', 'ADMIN')
    )
  );

-- ========================================
-- RLS POLICIES FOR ASSESSMENTS
-- ========================================
DROP POLICY IF EXISTS "Users can view own assessments" ON assessments;
CREATE POLICY "Users can view own assessments" 
  ON assessments FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own assessments" ON assessments;
CREATE POLICY "Users can create own assessments" 
  ON assessments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can view all assessments" ON assessments;
CREATE POLICY "Teachers can view all assessments" 
  ON assessments FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('TEACHER', 'ADMIN')
    )
  );

-- ========================================
-- RLS POLICIES FOR USER PROGRESS
-- ========================================
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" 
  ON user_progress FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" 
  ON user_progress FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" 
  ON user_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- INSERT SAMPLE DATA
-- ========================================

-- Sample Reading Texts
INSERT INTO reading_texts (title, content, difficulty_level, grade_level, word_count, language) VALUES
(
  'Kucing Kesayangan', 
  'Aku memiliki seekor kucing. Namanya Mimi. Mimi sangat lucu dan menggemaskan. Bulunya berwarna putih dan lembut. Setiap pagi, Mimi selalu menyambutku dengan suara menggemaskan. Aku sangat sayang dengan Mimi.',
  'EASY', 
  1, 
  32,
  'id'
),
(
  'Perjalanan ke Pantai', 
  'Liburan kemarin, keluargaku pergi ke pantai. Pantainya sangat indah dengan pasir putih dan air laut yang jernih. Aku bermain pasir dan berenang bersama kakak. Kami membuat istana pasir yang besar. Kami sangat senang dan tidak sabar untuk kembali lagi ke pantai.',
  'MEDIUM', 
  3, 
  45,
  'id'
),
(
  'Teknologi dan Masa Depan', 
  'Perkembangan teknologi di era digital saat ini sangat pesat. Artificial Intelligence dan machine learning telah mengubah cara manusia bekerja dan berinteraksi. Teknologi seperti Internet of Things (IoT) memungkinkan perangkat terhubung satu sama lain. Namun, kita harus bijak dalam menggunakan teknologi agar memberikan manfaat maksimal bagi kehidupan dan tidak menimbulkan dampak negatif.',
  'HARD', 
  6, 
  58,
  'id'
),
(
  'Hari Pertama Sekolah',
  'Hari ini adalah hari pertama masuk sekolah. Aku merasa gugup dan senang sekaligus. Tas baruku penuh dengan buku dan alat tulis. Ibu mengantarku ke sekolah. Di kelas, aku bertemu dengan teman-teman baru. Guru kami sangat ramah dan baik. Aku tidak sabar untuk belajar banyak hal baru.',
  'EASY',
  2,
  48,
  'id'
),
(
  'Menjaga Lingkungan',
  'Lingkungan yang bersih adalah tanggung jawab kita bersama. Kita harus membuang sampah pada tempatnya. Menanam pohon dapat membantu mengurangi polusi udara. Menggunakan tas belanja sendiri dapat mengurangi sampah plastik. Dengan menjaga lingkungan, kita menciptakan dunia yang lebih baik untuk generasi mendatang.',
  'MEDIUM',
  4,
  46,
  'id'
),
(
  'Sistem Tata Surya',
  'Tata surya kita terdiri dari Matahari dan delapan planet yang mengelilinginya. Merkurius adalah planet terdekat dengan Matahari, sedangkan Neptunus adalah yang terjauh. Bumi adalah satu-satunya planet yang diketahui memiliki kehidupan. Jupiter merupakan planet terbesar dalam tata surya. Setiap planet memiliki karakteristik unik yang menarik untuk dipelajari dalam ilmu astronomi.',
  'HARD',
  5,
  60,
  'id'
);

-- ========================================
-- FUNCTIONS FOR AUTO-UPDATE TIMESTAMPS
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_progress_updated_at ON user_progress;
CREATE TRIGGER update_progress_updated_at 
  BEFORE UPDATE ON user_progress 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- SUCCESS MESSAGE
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ CORTEXIA Database Schema Created Successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '   - users';
  RAISE NOTICE '   - reading_texts';
  RAISE NOTICE '   - assessments';
  RAISE NOTICE '   - user_progress';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Row Level Security Enabled';
  RAISE NOTICE '✅ Sample Reading Texts Inserted (6 texts)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to use with CORTEXIA!';
END $$;

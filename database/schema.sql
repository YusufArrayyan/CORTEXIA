-- CORTEXIA Database Schema
-- PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('siswa', 'guru', 'orang_tua', 'admin');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Users table (base table for all user types)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Siswa (Students) profile
CREATE TABLE siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(20),
    kelas VARCHAR(50),
    sekolah VARCHAR(255),
    nomor_induk VARCHAR(50),
    foto_profil TEXT,
    alamat TEXT,
    nomor_telepon VARCHAR(20),
    orang_tua_id UUID REFERENCES users(id),
    guru_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_siswa_user_id ON siswa(user_id);
CREATE INDEX idx_siswa_orang_tua ON siswa(orang_tua_id);
CREATE INDEX idx_siswa_guru ON siswa(guru_id);

-- Guru (Teachers) profile
CREATE TABLE guru (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    nip VARCHAR(50),
    mata_pelajaran VARCHAR(100),
    sekolah VARCHAR(255),
    nomor_telepon VARCHAR(20),
    foto_profil TEXT,
    spesialisasi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guru_user_id ON guru(user_id);

-- Orang Tua (Parents) profile
CREATE TABLE orang_tua (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    hubungan_dengan_anak VARCHAR(50), -- ayah, ibu, wali
    nomor_telepon VARCHAR(20),
    pekerjaan VARCHAR(100),
    alamat TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orang_tua_user_id ON orang_tua(user_id);

-- Admin profile
CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(255) NOT NULL,
    level VARCHAR(50), -- super_admin, admin
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- =============================================
-- ASSESSMENT & CALIBRATION
-- =============================================

-- Calibration sessions for eye tracking
CREATE TABLE kalibrasi_mata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    calibration_data JSONB, -- WebGazer calibration data
    accuracy_score DECIMAL(5,2),
    status VARCHAR(50), -- completed, failed, in_progress
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kalibrasi_siswa ON kalibrasi_mata(siswa_id);

-- Assessment types
CREATE TYPE assessment_type AS ENUM (
    'asesmen_awal',
    'asesmen_berkala', 
    're_assessment',
    'latihan'
);

-- Assessment sessions
CREATE TABLE asesmen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    kalibrasi_id UUID REFERENCES kalibrasi_mata(id),
    type assessment_type NOT NULL,
    materi_id UUID,
    status VARCHAR(50), -- not_started, in_progress, completed, cancelled
    durasi_detik INTEGER,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asesmen_siswa ON asesmen(siswa_id);
CREATE INDEX idx_asesmen_type ON asesmen(type);

-- =============================================
-- READING MATERIALS & CONTENT
-- =============================================

-- Content difficulty levels
CREATE TYPE difficulty_level AS ENUM ('sangat_mudah', 'mudah', 'sedang', 'sulit', 'sangat_sulit');

-- Reading materials
CREATE TABLE materi_bacaan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    konten TEXT NOT NULL,
    deskripsi TEXT,
    tingkat_kesulitan difficulty_level,
    kategori VARCHAR(100),
    sub_kategori VARCHAR(100),
    kata_kunci TEXT[],
    jumlah_kata INTEGER,
    estimasi_durasi_menit INTEGER,
    audio_url TEXT,
    gambar_url TEXT,
    fokus_fonologi JSONB, -- phonological focus areas
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materi_tingkat ON materi_bacaan(tingkat_kesulitan);
CREATE INDEX idx_materi_kategori ON materi_bacaan(kategori);

-- Interactive exercises
CREATE TABLE latihan_interaktif (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    tipe_latihan VARCHAR(100), -- phoneme_recognition, syllable_blending, etc.
    konten JSONB NOT NULL, -- exercise content and instructions
    tingkat_kesulitan difficulty_level,
    poin_reward INTEGER,
    durasi_estimasi_menit INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- GAZE TRACKING DATA
-- =============================================

-- Gaze tracking records
CREATE TABLE data_gaze_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asesmen_id UUID REFERENCES asesmen(id) ON DELETE CASCADE,
    timestamp_ms BIGINT NOT NULL,
    x_coordinate DECIMAL(10,4),
    y_coordinate DECIMAL(10,4),
    fixation_duration_ms INTEGER,
    saccade_length DECIMAL(10,4),
    word_index INTEGER, -- which word was being looked at
    is_regression BOOLEAN, -- backward eye movement
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gaze_asesmen ON data_gaze_tracking(asesmen_id);
CREATE INDEX idx_gaze_timestamp ON data_gaze_tracking(timestamp_ms);

-- Gaze analysis summary per assessment
CREATE TABLE analisis_gaze (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asesmen_id UUID REFERENCES asesmen(id) ON DELETE CASCADE,
    avg_fixation_duration_ms DECIMAL(10,2),
    total_fixations INTEGER,
    total_saccades INTEGER,
    regression_count INTEGER,
    reading_speed_wpm DECIMAL(10,2), -- words per minute
    focus_score DECIMAL(5,2), -- 0-100
    difficulty_indicators JSONB, -- areas of difficulty
    heat_map_data JSONB, -- visualization data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analisis_gaze_asesmen ON analisis_gaze(asesmen_id);

-- =============================================
-- SPEECH ANALYSIS DATA
-- =============================================

-- Speech recordings
CREATE TABLE rekaman_suara (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asesmen_id UUID REFERENCES asesmen(id) ON DELETE CASCADE,
    audio_file_url TEXT NOT NULL,
    duration_seconds DECIMAL(10,2),
    file_size_bytes BIGINT,
    format VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rekaman_asesmen ON rekaman_suara(asesmen_id);

-- Speech analysis results
CREATE TABLE analisis_suara (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asesmen_id UUID REFERENCES asesmen(id) ON DELETE CASCADE,
    rekaman_id UUID REFERENCES rekaman_suara(id),
    transcription TEXT,
    expected_text TEXT,
    accuracy_score DECIMAL(5,2), -- 0-100
    fluency_score DECIMAL(5,2), -- 0-100
    pronunciation_errors JSONB, -- detailed errors
    pause_patterns JSONB, -- pause analysis
    reading_speed_wpm DECIMAL(10,2),
    total_words INTEGER,
    correct_words INTEGER,
    mispronounced_words INTEGER,
    omitted_words INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analisis_suara_asesmen ON analisis_suara(asesmen_id);

-- =============================================
-- AI PROFILING & ASSESSMENT
-- =============================================

-- Phonological difficulty areas
CREATE TYPE fonologi_area AS ENUM (
    'konsonan',
    'vokal',
    'diftong',
    'kluster_konsonan',
    'suku_kata',
    'blending',
    'segmentasi'
);

-- Student reading difficulty profile
CREATE TABLE profil_kesulitan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    asesmen_id UUID REFERENCES asesmen(id),
    
    -- Overall scores
    overall_difficulty_score DECIMAL(5,2), -- 0-100
    reading_level VARCHAR(50),
    dyslexia_risk_score DECIMAL(5,2), -- 0-100
    
    -- Phonological awareness scores
    phoneme_awareness_score DECIMAL(5,2),
    syllable_awareness_score DECIMAL(5,2),
    rhyme_awareness_score DECIMAL(5,2),
    
    -- Specific difficulty areas
    kesulitan_fonologi JSONB, -- detailed phonological difficulties
    pola_kesalahan JSONB, -- error patterns
    area_kekuatan JSONB, -- areas of strength
    
    -- Recommendations
    rekomendasi JSONB, -- personalized recommendations
    target_pembelajaran JSONB, -- learning targets
    
    is_current BOOLEAN DEFAULT TRUE, -- latest profile
    profiled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profil_siswa ON profil_kesulitan(siswa_id);
CREATE INDEX idx_profil_current ON profil_kesulitan(siswa_id, is_current);

-- Assessment results summary
CREATE TABLE hasil_asesmen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asesmen_id UUID REFERENCES asesmen(id) ON DELETE CASCADE,
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    
    -- Composite scores
    overall_score DECIMAL(5,2),
    gaze_score DECIMAL(5,2),
    speech_score DECIMAL(5,2),
    comprehension_score DECIMAL(5,2),
    
    -- Time metrics
    completion_time_seconds INTEGER,
    words_read INTEGER,
    words_per_minute DECIMAL(10,2),
    
    -- Detailed results
    detailed_results JSONB,
    strengths TEXT[],
    weaknesses TEXT[],
    recommendations TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hasil_asesmen ON hasil_asesmen(asesmen_id);
CREATE INDEX idx_hasil_siswa ON hasil_asesmen(siswa_id);

-- =============================================
-- ADAPTIVE LEARNING & RECOMMENDATIONS
-- =============================================

-- Personalized learning recommendations
CREATE TABLE rekomendasi_pembelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    profil_id UUID REFERENCES profil_kesulitan(id),
    
    -- Recommendation type
    tipe_rekomendasi VARCHAR(100), -- materi, latihan, strategi
    prioritas INTEGER, -- 1-5, higher is more important
    
    -- Content recommendations
    materi_ids UUID[], -- array of materi_bacaan ids
    latihan_ids UUID[], -- array of latihan_interaktif ids
    
    -- Adaptive parameters
    tingkat_kesulitan_saran difficulty_level,
    durasi_saran_menit INTEGER,
    frekuensi_saran VARCHAR(50), -- daily, weekly, etc.
    
    -- Details
    deskripsi TEXT,
    alasan TEXT, -- why this is recommended
    target_kemampuan TEXT[],
    
    -- Status tracking
    status VARCHAR(50), -- pending, in_progress, completed, skipped
    dimulai_pada TIMESTAMP,
    diselesaikan_pada TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rekomendasi_siswa ON rekomendasi_pembelajaran(siswa_id);
CREATE INDEX idx_rekomendasi_status ON rekomendasi_pembelajaran(status);

-- Learning progress tracking
CREATE TABLE progress_pembelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    materi_id UUID REFERENCES materi_bacaan(id),
    latihan_id UUID REFERENCES latihan_interaktif(id),
    
    -- Progress metrics
    status VARCHAR(50), -- not_started, in_progress, completed
    completion_percentage DECIMAL(5,2),
    skor_terakhir DECIMAL(5,2),
    waktu_yang_dihabiskan_menit INTEGER,
    jumlah_percobaan INTEGER,
    
    -- Performance tracking
    performa_history JSONB, -- historical performance data
    kesalahan_umum JSONB, -- common errors
    
    last_accessed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_siswa ON progress_pembelajaran(siswa_id);
CREATE INDEX idx_progress_materi ON progress_pembelajaran(materi_id);

-- =============================================
-- INTERVENTIONS (Teacher-assigned)
-- =============================================

-- Teacher interventions
CREATE TABLE intervensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guru_id UUID REFERENCES guru(id) ON DELETE SET NULL,
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tipe_intervensi VARCHAR(100), -- targeted_reading, phonics_drill, etc.
    
    -- Intervention content
    materi_khusus JSONB, -- custom materials
    aktivitas JSONB, -- activities
    target_kemampuan TEXT[],
    
    -- Scheduling
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    frekuensi VARCHAR(50),
    durasi_per_sesi_menit INTEGER,
    
    -- Status and tracking
    status VARCHAR(50), -- planned, active, completed, cancelled
    progress_notes TEXT,
    efektivitas_score DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_intervensi_guru ON intervensi(guru_id);
CREATE INDEX idx_intervensi_siswa ON intervensi(siswa_id);
CREATE INDEX idx_intervensi_status ON intervensi(status);

-- =============================================
-- FEEDBACK & COMMUNICATION
-- =============================================

-- Feedback from students
CREATE TABLE feedback_siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    materi_id UUID REFERENCES materi_bacaan(id),
    latihan_id UUID REFERENCES latihan_interaktif(id),
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    komentar TEXT,
    kesulitan_yang_dialami TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_siswa ON feedback_siswa(siswa_id);

-- Communication/messages between users
CREATE TABLE pesan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pengirim_id UUID REFERENCES users(id) ON DELETE SET NULL,
    penerima_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    subjek VARCHAR(255),
    isi TEXT NOT NULL,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    parent_message_id UUID REFERENCES pesan(id), -- for replies
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pesan_pengirim ON pesan(pengirim_id);
CREATE INDEX idx_pesan_penerima ON pesan(penerima_id);
CREATE INDEX idx_pesan_unread ON pesan(penerima_id, is_read);

-- =============================================
-- SYSTEM & ADMIN
-- =============================================

-- AI Model versions
CREATE TABLE ai_model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100), -- gaze_analysis, speech_analysis, assessment
    
    model_file_path TEXT,
    model_config JSONB,
    
    accuracy_metrics JSONB,
    training_date DATE,
    
    is_active BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_model_type ON ai_model_versions(model_type);
CREATE INDEX idx_model_active ON ai_model_versions(is_active);

-- System audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(100), -- assessment_complete, new_recommendation, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    link TEXT, -- optional link to related content
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- =============================================
-- ANALYTICS & REPORTING
-- =============================================

-- Class-level analytics (for teachers)
CREATE TABLE analytics_kelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guru_id UUID REFERENCES guru(id) ON DELETE CASCADE,
    kelas VARCHAR(100),
    
    periode_mulai DATE,
    periode_selesai DATE,
    
    total_siswa INTEGER,
    rata_rata_skor DECIMAL(5,2),
    siswa_berisiko INTEGER,
    tingkat_penyelesaian DECIMAL(5,2),
    
    detailed_metrics JSONB,
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parent monitoring summary
CREATE TABLE monitoring_orang_tua (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orang_tua_id UUID REFERENCES orang_tua(id) ON DELETE CASCADE,
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    
    tanggal DATE,
    
    -- Daily summary
    aktivitas_hari_ini JSONB,
    waktu_belajar_menit INTEGER,
    latihan_diselesaikan INTEGER,
    skor_rata_rata DECIMAL(5,2),
    
    -- Alerts
    alerts JSONB, -- important notifications for parent
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monitoring_orang_tua ON monitoring_orang_tua(orang_tua_id, tanggal);

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON siswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guru_updated_at BEFORE UPDATE ON guru
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orang_tua_updated_at BEFORE UPDATE ON orang_tua
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materi_bacaan_updated_at BEFORE UPDATE ON materi_bacaan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profil_kesulitan_updated_at BEFORE UPDATE ON profil_kesulitan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rekomendasi_updated_at BEFORE UPDATE ON rekomendasi_pembelajaran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress_pembelajaran
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervensi_updated_at BEFORE UPDATE ON intervensi
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View: Student dashboard summary
CREATE VIEW v_siswa_dashboard AS
SELECT 
    s.id as siswa_id,
    s.nama_lengkap,
    u.email,
    COUNT(DISTINCT a.id) as total_asesmen,
    AVG(ha.overall_score) as rata_rata_skor,
    pk.overall_difficulty_score,
    pk.reading_level,
    COUNT(DISTINCT pp.id) as total_progress,
    SUM(pp.waktu_yang_dihabiskan_menit) as total_waktu_belajar
FROM siswa s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN asesmen a ON s.id = a.siswa_id
LEFT JOIN hasil_asesmen ha ON a.id = ha.asesmen_id
LEFT JOIN profil_kesulitan pk ON s.id = pk.siswa_id AND pk.is_current = true
LEFT JOIN progress_pembelajaran pp ON s.id = pp.siswa_id
GROUP BY s.id, s.nama_lengkap, u.email, pk.overall_difficulty_score, pk.reading_level;

-- View: Teacher class overview
CREATE VIEW v_guru_kelas AS
SELECT 
    g.id as guru_id,
    g.nama_lengkap as nama_guru,
    s.kelas,
    COUNT(DISTINCT s.id) as jumlah_siswa,
    AVG(pk.overall_difficulty_score) as avg_difficulty_score,
    COUNT(DISTINCT CASE WHEN pk.dyslexia_risk_score > 70 THEN s.id END) as siswa_berisiko
FROM guru g
LEFT JOIN siswa s ON g.id = s.guru_id
LEFT JOIN profil_kesulitan pk ON s.id = pk.siswa_id AND pk.is_current = true
GROUP BY g.id, g.nama_lengkap, s.kelas;

-- View: Parent monitoring
CREATE VIEW v_orang_tua_monitoring AS
SELECT 
    ot.id as orang_tua_id,
    ot.nama_lengkap as nama_orang_tua,
    s.id as siswa_id,
    s.nama_lengkap as nama_anak,
    COUNT(DISTINCT a.id) as total_asesmen,
    MAX(a.completed_at) as asesmen_terakhir,
    AVG(ha.overall_score) as rata_rata_skor,
    pk.overall_difficulty_score,
    COUNT(DISTINCT pp.id) FILTER (WHERE pp.last_accessed_at >= CURRENT_DATE - INTERVAL '7 days') as aktivitas_7_hari
FROM orang_tua ot
LEFT JOIN siswa s ON ot.id = s.orang_tua_id
LEFT JOIN asesmen a ON s.id = a.siswa_id
LEFT JOIN hasil_asesmen ha ON a.id = ha.asesmen_id
LEFT JOIN profil_kesulitan pk ON s.id = pk.siswa_id AND pk.is_current = true
LEFT JOIN progress_pembelajaran pp ON s.id = pp.siswa_id
GROUP BY ot.id, ot.nama_lengkap, s.id, s.nama_lengkap, pk.overall_difficulty_score;

-- =============================================
-- INITIAL DATA / SEEDS
-- =============================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('system_name', '"CORTEXIA"', 'System name'),
('min_calibration_accuracy', '75.0', 'Minimum accuracy required for calibration (percentage)'),
('assessment_timeout_minutes', '30', 'Default assessment timeout in minutes'),
('gaze_sampling_rate_ms', '100', 'Gaze data sampling rate in milliseconds'),
('speech_analysis_enabled', 'true', 'Enable speech analysis feature'),
('default_difficulty_level', '"sedang"', 'Default content difficulty level');

COMMENT ON TABLE users IS 'Base user table for all user types';
COMMENT ON TABLE siswa IS 'Student profile and information';
COMMENT ON TABLE guru IS 'Teacher profile and information';
COMMENT ON TABLE orang_tua IS 'Parent/Guardian profile and information';
COMMENT ON TABLE asesmen IS 'Assessment sessions for students';
COMMENT ON TABLE data_gaze_tracking IS 'Raw gaze tracking data collected during assessments';
COMMENT ON TABLE analisis_gaze IS 'Analyzed gaze tracking metrics';
COMMENT ON TABLE analisis_suara IS 'Speech analysis results';
COMMENT ON TABLE profil_kesulitan IS 'AI-generated reading difficulty profiles';
COMMENT ON TABLE rekomendasi_pembelajaran IS 'Personalized learning recommendations';

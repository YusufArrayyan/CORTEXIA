# CORTEXIA API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.cortexia.id/api
```

## Authentication

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword",
  "role": "siswa|guru|orang_tua|admin",
  "profile": {
    // Role-specific profile data
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "siswa"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "siswa",
      "profile": {}
    }
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

---

## Students (Siswa) Endpoints

### Get Student Profile
```http
GET /api/students/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nama_lengkap": "John Doe",
    "tanggal_lahir": "2010-05-15",
    "kelas": "5A",
    "sekolah": "SD Example",
    "foto_profil": "url",
    "orang_tua": {},
    "guru": {}
  }
}
```

### Update Student Profile
```http
PUT /api/students/profile
Authorization: Bearer {token}
```

### Get Student Dashboard
```http
GET /api/students/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {},
    "recentAssessments": [],
    "currentProfile": {},
    "recommendations": [],
    "progressSummary": {},
    "achievements": []
  }
}
```

---

## Assessments (Asesmen) Endpoints

### Create Calibration Session
```http
POST /api/assessments/calibration
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "siswa_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "calibration_id": "uuid",
    "session_id": "unique-session-id",
    "status": "in_progress"
  }
}
```

### Update Calibration Data
```http
PUT /api/assessments/calibration/:calibrationId
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "calibration_data": {
    // WebGazer calibration data
  },
  "accuracy_score": 85.5,
  "status": "completed"
}
```

### Start Assessment
```http
POST /api/assessments/start
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "siswa_id": "uuid",
  "kalibrasi_id": "uuid",
  "type": "asesmen_awal|asesmen_berkala|re_assessment",
  "materi_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "asesmen_id": "uuid",
    "session_id": "unique-session-id",
    "materi": {},
    "status": "in_progress",
    "started_at": "2024-01-01T10:00:00Z"
  }
}
```

### Submit Gaze Data
```http
POST /api/assessments/:asesmenId/gaze-data
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "data": [
    {
      "timestamp_ms": 1234567890,
      "x_coordinate": 512.5,
      "y_coordinate": 384.2,
      "fixation_duration_ms": 250,
      "word_index": 5
    }
  ]
}
```

### Submit Speech Recording
```http
POST /api/assessments/:asesmenId/speech-data
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
- `audio_file`: audio file (WAV, MP3, etc.)
- `duration_seconds`: number
- `expected_text`: string

### Complete Assessment
```http
POST /api/assessments/:asesmenId/complete
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "asesmen_id": "uuid",
    "hasil": {
      "overall_score": 78.5,
      "gaze_score": 75.0,
      "speech_score": 82.0
    },
    "profil_kesulitan": {},
    "rekomendasi": []
  }
}
```

### Get Assessment Results
```http
GET /api/assessments/:asesmenId/results
Authorization: Bearer {token}
```

### Get Assessment History
```http
GET /api/assessments/history
Authorization: Bearer {token}
Query Parameters: ?siswa_id=uuid&page=1&limit=10
```

---

## Gaze Analysis Endpoints

### Analyze Gaze Data
```http
POST /api/analysis/gaze/:asesmenId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "avg_fixation_duration_ms": 285.5,
    "total_fixations": 150,
    "regression_count": 12,
    "reading_speed_wpm": 95,
    "focus_score": 75.5,
    "difficulty_indicators": {
      "problematic_words": [5, 12, 23],
      "slow_areas": [[10, 15], [30, 35]]
    },
    "heat_map_data": {}
  }
}
```

### Get Gaze Visualization
```http
GET /api/analysis/gaze/:asesmenId/visualization
Authorization: Bearer {token}
```

---

## Speech Analysis Endpoints

### Analyze Speech
```http
POST /api/analysis/speech/:asesmenId
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": "transcribed text",
    "accuracy_score": 85.5,
    "fluency_score": 78.0,
    "pronunciation_errors": [
      {
        "word": "difficult",
        "expected": "difficult",
        "actual": "dificult",
        "position": 5
      }
    ],
    "pause_patterns": [],
    "reading_speed_wpm": 92
  }
}
```

---

## Reading Difficulty Profile Endpoints

### Get Current Profile
```http
GET /api/profiles/current
Authorization: Bearer {token}
Query Parameters: ?siswa_id=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "siswa_id": "uuid",
    "overall_difficulty_score": 65.5,
    "reading_level": "below_grade",
    "dyslexia_risk_score": 45.0,
    "phoneme_awareness_score": 70.0,
    "kesulitan_fonologi": {
      "konsonan": ["r", "l"],
      "vokal": [],
      "kluster_konsonan": ["tr", "kr"]
    },
    "rekomendasi": [],
    "profiled_at": "2024-01-01T10:00:00Z"
  }
}
```

### Get Profile History
```http
GET /api/profiles/history
Authorization: Bearer {token}
Query Parameters: ?siswa_id=uuid
```

### Compare Profiles
```http
POST /api/profiles/compare
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "profile_ids": ["uuid1", "uuid2"]
}
```

---

## Learning Materials Endpoints

### Get Reading Materials
```http
GET /api/materials
Authorization: Bearer {token}
Query Parameters: ?tingkat_kesulitan=sedang&kategori=cerita&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "uuid",
        "judul": "Cerita Pendek",
        "konten": "text content...",
        "tingkat_kesulitan": "sedang",
        "kategori": "cerita",
        "jumlah_kata": 150,
        "estimasi_durasi_menit": 10
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50
    }
  }
}
```

### Get Material Details
```http
GET /api/materials/:materialId
Authorization: Bearer {token}
```

### Create Material (Admin/Guru only)
```http
POST /api/materials
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "judul": "Material Title",
  "konten": "Content text...",
  "tingkat_kesulitan": "sedang",
  "kategori": "cerita",
  "fokus_fonologi": {
    "target_sounds": ["r", "l"]
  }
}
```

### Get Interactive Exercises
```http
GET /api/materials/exercises
Authorization: Bearer {token}
Query Parameters: ?tingkat_kesulitan=sedang
```

---

## Recommendations Endpoints

### Get Personalized Recommendations
```http
GET /api/recommendations
Authorization: Bearer {token}
Query Parameters: ?siswa_id=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "uuid",
        "tipe_rekomendasi": "materi",
        "prioritas": 1,
        "deskripsi": "Practice materials for R and L sounds",
        "materi_ids": ["uuid1", "uuid2"],
        "tingkat_kesulitan_saran": "mudah",
        "status": "pending"
      }
    ]
  }
}
```

### Update Recommendation Status
```http
PUT /api/recommendations/:recommendationId
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "in_progress|completed|skipped"
}
```

---

## Learning Progress Endpoints

### Get Learning Progress
```http
GET /api/progress
Authorization: Bearer {token}
Query Parameters: ?siswa_id=uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_progress": 65,
    "materials_completed": 15,
    "exercises_completed": 30,
    "total_time_minutes": 450,
    "recent_activities": []
  }
}
```

### Update Progress
```http
PUT /api/progress/:materialId
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "status": "in_progress|completed",
  "completion_percentage": 75,
  "skor_terakhir": 85.5,
  "waktu_yang_dihabiskan_menit": 15
}
```

---

## Teacher (Guru) Endpoints

### Get Teacher Dashboard
```http
GET /api/teachers/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_students": 30,
    "students_at_risk": 5,
    "recent_assessments": [],
    "class_analytics": {},
    "interventions": []
  }
}
```

### Get Students List
```http
GET /api/teachers/students
Authorization: Bearer {token}
Query Parameters: ?kelas=5A
```

### Get Student Details (for monitoring)
```http
GET /api/teachers/students/:siswaId
Authorization: Bearer {token}
```

### Create Intervention
```http
POST /api/teachers/interventions
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "siswa_id": "uuid",
  "judul": "Targeted Reading Intervention",
  "deskripsi": "Focus on R and L sounds",
  "tipe_intervensi": "targeted_reading",
  "tanggal_mulai": "2024-01-10",
  "durasi_per_sesi_menit": 30
}
```

### Get Class Analytics
```http
GET /api/teachers/analytics
Authorization: Bearer {token}
Query Parameters: ?kelas=5A&periode_mulai=2024-01-01&periode_selesai=2024-01-31
```

---

## Parent (Orang Tua) Endpoints

### Get Parent Dashboard
```http
GET /api/parents/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "children": [
      {
        "siswa_id": "uuid",
        "nama": "Child Name",
        "recent_activities": [],
        "current_profile": {},
        "progress_summary": {}
      }
    ]
  }
}
```

### Get Child Monitoring Data
```http
GET /api/parents/monitoring/:siswaId
Authorization: Bearer {token}
Query Parameters: ?date=2024-01-01
```

### Get Assessment Results (for child)
```http
GET /api/parents/assessments/:siswaId
Authorization: Bearer {token}
```

---

## Admin Endpoints

### User Management
```http
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:userId
DELETE /api/admin/users/:userId
Authorization: Bearer {token}
```

### System Analytics
```http
GET /api/admin/analytics
Authorization: Bearer {token}
Query Parameters: ?start_date=2024-01-01&end_date=2024-01-31
```

### AI Model Management
```http
GET /api/admin/ai-models
POST /api/admin/ai-models
PUT /api/admin/ai-models/:modelId
Authorization: Bearer {token}
```

### System Settings
```http
GET /api/admin/settings
PUT /api/admin/settings/:key
Authorization: Bearer {token}
```

### Audit Logs
```http
GET /api/admin/audit-logs
Authorization: Bearer {token}
Query Parameters: ?user_id=uuid&action=login&start_date=2024-01-01
```

---

## Notifications Endpoints

### Get Notifications
```http
GET /api/notifications
Authorization: Bearer {token}
Query Parameters: ?is_read=false&page=1&limit=20
```

### Mark as Read
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer {token}
```

### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer {token}
```

---

## Feedback Endpoints

### Submit Feedback
```http
POST /api/feedback
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "materi_id": "uuid",
  "rating": 4,
  "komentar": "Good material but a bit difficult",
  "kesulitan_yang_dialami": "Some words were hard to pronounce"
}
```

---

## Messages Endpoints

### Get Messages
```http
GET /api/messages
Authorization: Bearer {token}
Query Parameters: ?is_read=false
```

### Send Message
```http
POST /api/messages
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "penerima_id": "uuid",
  "subjek": "Subject",
  "isi": "Message content"
}
```

### Reply to Message
```http
POST /api/messages/:messageId/reply
Authorization: Bearer {token}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:5000', {
  auth: {
    token: 'jwt-token'
  }
});
```

### Events

**Client → Server:**
- `assessment:start` - Start assessment session
- `gaze:data` - Real-time gaze data
- `speech:start` - Start speech recording
- `speech:stop` - Stop speech recording

**Server → Client:**
- `assessment:update` - Assessment progress update
- `analysis:result` - Analysis results ready
- `notification` - New notification
- `message:new` - New message received

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes
- `AUTH_REQUIRED` - Authentication required
- `AUTH_INVALID` - Invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `CALIBRATION_REQUIRED` - Calibration needed before assessment
- `ASSESSMENT_IN_PROGRESS` - Cannot start new assessment
- `SERVER_ERROR` - Internal server error

---

## Rate Limiting

- Anonymous: 100 requests per 15 minutes
- Authenticated: 1000 requests per 15 minutes
- Admin: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## Pagination

All list endpoints support pagination:

Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response includes:
```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

---

## Filtering & Sorting

Query Parameters:
- `sort_by` - Field to sort by
- `order` - `asc` or `desc`
- `filter[field]` - Filter by field value

Example:
```
GET /api/assessments?sort_by=created_at&order=desc&filter[status]=completed
```

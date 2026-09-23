# CORTEXIA System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (React App)                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │   Teacher    │  │   Parent     │          │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   WebGazer   │  │ Web Speech   │  │   Admin      │          │
│  │   (Gaze)     │  │   API        │  │   Panel      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ HTTPS / WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                              │
│                      (Nginx / Load Balancer)                     │
└─────────────────────────────────────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Backend API   │ │   AI Service    │ │   WebSocket     │
│  (Node/Express) │ │  (Python/Fast   │ │   Server        │
│                 │ │     API)        │ │   (Socket.io)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │   MongoDB       │ │   Redis         │
│   (Primary DB)  │ │   (Analytics)   │ │   (Cache)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   File Storage  │ │   ML Models     │ │   Monitoring    │
│   (S3/Local)    │ │   (TensorFlow)  │ │  (Prometheus)   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 🏗️ Component Architecture

### 1. Frontend Layer (React)

```
frontend/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── authSlice.ts (Redux)
│   │   │
│   │   ├── assessment/
│   │   │   ├── CalibrationScreen.tsx
│   │   │   ├── AssessmentScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   └── assessmentSlice.ts
│   │   │
│   │   ├── gaze-tracking/
│   │   │   ├── GazeTracker.tsx (WebGazer integration)
│   │   │   ├── CalibrationOverlay.tsx
│   │   │   ├── GazeHeatmap.tsx
│   │   │   └── useGazeTracking.ts (custom hook)
│   │   │
│   │   ├── speech-analysis/
│   │   │   ├── SpeechRecorder.tsx
│   │   │   ├── SpeechVisualizer.tsx
│   │   │   └── useSpeechRecognition.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── student/
│   │   │   │   ├── StudentDashboard.tsx
│   │   │   │   ├── ProfileCard.tsx
│   │   │   │   ├── ProgressChart.tsx
│   │   │   │   └── RecommendationsList.tsx
│   │   │   │
│   │   │   ├── teacher/
│   │   │   │   ├── TeacherDashboard.tsx
│   │   │   │   ├── StudentsList.tsx
│   │   │   │   ├── ClassAnalytics.tsx
│   │   │   │   └── InterventionManager.tsx
│   │   │   │
│   │   │   ├── parent/
│   │   │   │   ├── ParentDashboard.tsx
│   │   │   │   ├── ChildProgress.tsx
│   │   │   │   └── MonitoringView.tsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.tsx
│   │   │       ├── UserManagement.tsx
│   │   │       ├── ContentManagement.tsx
│   │   │       └── SystemSettings.tsx
│   │   │
│   │   └── learning/
│   │       ├── ReadingMaterialView.tsx
│   │       ├── InteractiveExercise.tsx
│   │       └── ProgressTracker.tsx
│   │
│   ├── components/ (shared UI components)
│   ├── services/ (API services)
│   ├── hooks/ (custom React hooks)
│   ├── store/ (Redux store)
│   └── utils/ (helper functions)
```

**Key Technologies:**
- React 18+ with TypeScript
- Redux Toolkit for state management
- Material-UI / Tailwind CSS for UI
- WebGazer.js for eye tracking
- Web Speech API for speech recognition
- Recharts for data visualization
- Socket.io-client for real-time communication

---

### 2. Backend Layer (Node.js/Express)

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── assessmentController.js
│   │   ├── gazeController.js
│   │   ├── speechController.js
│   │   ├── profileController.js
│   │   ├── recommendationController.js
│   │   ├── materialController.js
│   │   ├── progressController.js
│   │   └── userController.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Assessment.js
│   │   ├── GazeData.js
│   │   ├── SpeechAnalysis.js
│   │   ├── Profile.js
│   │   └── Material.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── assessment.routes.js
│   │   ├── analysis.routes.js
│   │   ├── profile.routes.js
│   │   ├── recommendation.routes.js
│   │   └── user.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js (JWT verification)
│   │   ├── role.middleware.js (RBAC)
│   │   ├── validate.middleware.js (input validation)
│   │   ├── rateLimit.middleware.js
│   │   └── error.middleware.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── assessmentService.js
│   │   ├── gazeAnalysisService.js
│   │   ├── speechAnalysisService.js
│   │   ├── profilingService.js
│   │   ├── recommendationService.js
│   │   ├── notificationService.js
│   │   └── emailService.js
│   │
│   ├── utils/
│   │   ├── database.js (DB connection)
│   │   ├── jwt.js (token generation)
│   │   ├── validators.js
│   │   └── helpers.js
│   │
│   ├── config/
│   │   ├── database.config.js
│   │   ├── jwt.config.js
│   │   └── app.config.js
│   │
│   └── app.js (main application)
```

**Key Technologies:**
- Node.js 18+
- Express.js framework
- Prisma/Sequelize ORM
- JWT for authentication
- bcrypt for password hashing
- Winston for logging
- Socket.io for WebSocket
- Multer for file uploads

---

### 3. AI/ML Layer (Python/FastAPI)

```
ai-models/
├── src/
│   ├── api/
│   │   ├── main.py (FastAPI app)
│   │   ├── routers/
│   │   │   ├── gaze_analysis.py
│   │   │   ├── speech_analysis.py
│   │   │   ├── assessment.py
│   │   │   └── recommendation.py
│   │   └── dependencies.py
│   │
│   ├── models/
│   │   ├── gaze/
│   │   │   ├── fixation_detector.py
│   │   │   ├── saccade_analyzer.py
│   │   │   └── reading_pattern.py
│   │   │
│   │   ├── speech/
│   │   │   ├── transcription.py
│   │   │   ├── fluency_analyzer.py
│   │   │   ├── pronunciation_checker.py
│   │   │   └── pause_detector.py
│   │   │
│   │   ├── profiling/
│   │   │   ├── difficulty_classifier.py
│   │   │   ├── dyslexia_detector.py
│   │   │   ├── phonological_analyzer.py
│   │   │   └── multimodal_fusion.py
│   │   │
│   │   └── recommendation/
│   │       ├── content_recommender.py
│   │       ├── difficulty_adapter.py
│   │       └── collaborative_filter.py
│   │
│   ├── preprocessing/
│   │   ├── gaze_preprocessor.py
│   │   ├── speech_preprocessor.py
│   │   └── text_preprocessor.py
│   │
│   ├── training/
│   │   ├── train_gaze_model.py
│   │   ├── train_speech_model.py
│   │   ├── train_profiling_model.py
│   │   └── evaluate.py
│   │
│   └── utils/
│       ├── data_loader.py
│       ├── metrics.py
│       └── visualization.py
```

**Key Technologies:**
- Python 3.9+
- FastAPI framework
- TensorFlow / PyTorch
- Scikit-learn
- Librosa (audio processing)
- OpenCV / MediaPipe
- NumPy, Pandas

---

## 🔄 Data Flow

### Assessment Flow

```
1. Student Login
   └→ Frontend: Login Component
       └→ Backend: POST /api/auth/login
           └→ Database: Verify credentials
               └→ Return JWT token

2. Start Calibration
   └→ Frontend: CalibrationScreen
       └→ WebGazer: Initialize tracking
           └→ Collect calibration points
               └→ Backend: POST /api/assessments/calibration
                   └→ Store calibration data

3. Start Assessment
   └→ Frontend: AssessmentScreen
       ├→ Display reading material
       │   └→ Backend: GET /api/materials/:id
       │
       ├→ WebGazer: Track gaze
       │   └→ Real-time gaze data stream
       │       └→ WebSocket: gaze:data event
       │           └→ Backend: Store gaze data
       │
       └→ Web Speech API: Record speech
           └→ Frontend: Record audio
               └→ Backend: POST /api/assessments/:id/speech-data
                   └→ Store audio file

4. Process Assessment
   └→ Backend: Complete assessment
       ├→ AI Service: POST /api/analysis/gaze
       │   └→ Analyze gaze patterns
       │       └→ Return gaze metrics
       │
       ├→ AI Service: POST /api/analysis/speech
       │   └→ Transcribe & analyze speech
       │       └→ Return speech metrics
       │
       └→ AI Service: POST /api/profiling/assess
           └→ Multimodal data fusion
               ├→ Generate difficulty profile
               ├→ Calculate risk scores
               └→ Generate recommendations

5. Display Results
   └→ Frontend: ResultsScreen
       └→ Backend: GET /api/assessments/:id/results
           └→ Display scores, profile, recommendations
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└─────┬────┘                                    └────┬─────┘
      │                                              │
      │  1. POST /api/auth/login                    │
      │     { email, password }                     │
      │─────────────────────────────────────────────>│
      │                                              │
      │                                              │ 2. Verify
      │                                              │    credentials
      │                                              │
      │  3. Response                                 │
      │     { accessToken, refreshToken, user }     │
      │<─────────────────────────────────────────────│
      │                                              │
      │  4. Store tokens in localStorage/cookies    │
      │                                              │
      │  5. API Request                              │
      │     Authorization: Bearer {accessToken}      │
      │─────────────────────────────────────────────>│
      │                                              │
      │                                              │ 6. Verify JWT
      │                                              │
      │  7. Response with data                       │
      │<─────────────────────────────────────────────│
      │                                              │
      │  8. Access Token Expired                     │
      │  POST /api/auth/refresh                      │
      │     { refreshToken }                         │
      │─────────────────────────────────────────────>│
      │                                              │
      │                                              │ 9. Verify
      │                                              │    refresh token
      │                                              │
      │  10. New Access Token                        │
      │<─────────────────────────────────────────────│
      │                                              │
```

### Role-Based Access Control (RBAC)

```
Role Hierarchy:
┌──────────┐
│  Admin   │  - Full system access
└────┬─────┘
     │
     ├─────┬──────────┬─────────────┐
     │     │          │             │
┌────▼───┐ │    ┌─────▼─────┐ ┌────▼────────┐
│  Guru  │ │    │   Siswa   │ │ Orang Tua   │
└────────┘ │    └───────────┘ └─────────────┘
           │
     ┌─────▼──────┐
     │ Guest/Anon │
     └────────────┘

Permissions Matrix:
┌────────────────────┬───────┬───────┬───────┬──────────────┬───────┐
│     Resource       │ Admin │ Guru  │ Siswa │  Orang Tua   │ Guest │
├────────────────────┼───────┼───────┼───────┼──────────────┼───────┤
│ Own Profile        │  CRUD │  CRUD │  CRUD │     CRUD     │   -   │
│ Other Profiles     │  CRUD │   R   │   -   │   R (child)  │   -   │
│ Assessments        │  CRUD │   R   │  CRUD │   R (child)  │   -   │
│ Materials          │  CRUD │  CRU  │   R   │      -       │   -   │
│ Interventions      │  CRUD │  CRUD │   R   │   R (child)  │   -   │
│ Analytics          │  CRUD │   R   │   R   │   R (child)  │   -   │
│ System Settings    │  CRUD │   -   │   -   │      -       │   -   │
│ User Management    │  CRUD │   -   │   -   │      -       │   -   │
└────────────────────┴───────┴───────┴───────┴──────────────┴───────┘

CRUD: Create, Read, Update, Delete
R: Read only
```

---

## 📊 Database Schema Overview

### Core Entities

```
users
  ├── siswa (students)
  ├── guru (teachers)
  ├── orang_tua (parents)
  └── admin

assessments
  ├── kalibrasi_mata (calibration)
  ├── asesmen (assessment sessions)
  │   ├── data_gaze_tracking
  │   ├── analisis_gaze
  │   ├── rekaman_suara (speech recordings)
  │   └── analisis_suara
  └── hasil_asesmen (results)

profiling
  ├── profil_kesulitan (difficulty profiles)
  └── rekomendasi_pembelajaran (recommendations)

content
  ├── materi_bacaan (reading materials)
  ├── latihan_interaktif (exercises)
  └── progress_pembelajaran (progress tracking)

interventions
  ├── intervensi
  └── feedback_siswa

communication
  ├── pesan (messages)
  └── notifications

system
  ├── ai_model_versions
  ├── audit_log
  └── system_settings
```

---

## 🔧 Technology Stack Summary

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI / Tailwind CSS
- **Gaze Tracking**: WebGazer.js
- **Speech**: Web Speech API
- **Charts**: Recharts / Chart.js
- **Real-time**: Socket.io-client

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (primary), MongoDB (analytics)
- **ORM**: Prisma / Sequelize
- **Cache**: Redis
- **Authentication**: JWT
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Validation**: Joi / Yup

### AI/ML
- **Language**: Python 3.9+
- **Framework**: FastAPI
- **ML Libraries**: 
  - TensorFlow / PyTorch
  - Scikit-learn
  - Librosa (audio)
  - OpenCV / MediaPipe (vision)
- **Data Processing**: NumPy, Pandas

### DevOps
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus, Grafana
- **Logging**: Winston, ELK Stack
- **CI/CD**: GitHub Actions

---

## 🚀 Deployment Architecture

### Development
```
docker-compose up -d
└── All services running locally
    ├── Frontend: localhost:3000
    ├── Backend: localhost:5000
    ├── AI Service: localhost:8000
    ├── PostgreSQL: localhost:5432
    ├── MongoDB: localhost:27017
    ├── Redis: localhost:6379
    └── PgAdmin: localhost:5050
```

### Production
```
┌───────────────────────────────────────┐
│          Load Balancer / CDN          │
└───────────────┬───────────────────────┘
                │
┌───────────────▼───────────────────────┐
│          Nginx (Reverse Proxy)        │
└───────┬───────────────┬───────────────┘
        │               │
┌───────▼─────┐  ┌──────▼──────┐
│  Frontend   │  │  Backend    │
│  (Static)   │  │  API        │
│  Container  │  │  Cluster    │
└─────────────┘  └──────┬──────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼─────┐  ┌──────▼──────┐ ┌─────▼──────┐
│  PostgreSQL │  │   MongoDB   │ │   Redis    │
│  (Primary)  │  │ (Analytics) │ │  (Cache)   │
└─────────────┘  └─────────────┘ └────────────┘
```

---

## 📈 Scalability Considerations

1. **Horizontal Scaling**
   - Multiple backend API instances behind load balancer
   - Stateless API design
   - Session management via Redis

2. **Database Optimization**
   - Read replicas for PostgreSQL
   - Sharding for MongoDB analytics data
   - Database connection pooling

3. **Caching Strategy**
   - Redis for session data
   - Redis for frequently accessed data
   - CDN for static assets

4. **Asynchronous Processing**
   - Message queue (RabbitMQ/Redis) for heavy tasks
   - Background workers for ML model inference
   - Async processing for speech/gaze analysis

5. **Microservices Consideration**
   - Separate AI service already isolated
   - Can split into more services as needed
   - API Gateway for routing

---

## 🔍 Monitoring & Logging

### Metrics to Track
- API response times
- Database query performance
- ML model inference time
- User session duration
- Assessment completion rate
- System resource utilization

### Logging Strategy
- Application logs (Winston)
- Access logs (Nginx)
- Error tracking (Sentry)
- Audit trail (database)

### Alerts
- High error rate
- Slow response times
- Database connection issues
- High memory/CPU usage
- Failed ML model predictions

---

This architecture is designed to be **modular**, **scalable**, and **maintainable** while supporting the complex multimodal AI analysis requirements of CORTEXIA.

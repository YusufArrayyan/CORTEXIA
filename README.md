# CORTEXIA - Multimodal AI-Based Reading Difficulty Profiling

## 🎯 Deskripsi Sistem

CORTEXIA adalah sistem berbasis AI multimodal yang menggunakan webcam untuk analisis gaze tracking dan speech analysis guna memprofil kesulitan membaca siswa dan memberikan dukungan pembelajaran yang adaptif.

## 🏗️ Arsitektur Sistem

### Technology Stack

#### Frontend
- **Framework**: React 18+ dengan TypeScript
- **UI Library**: Material-UI (MUI) / Tailwind CSS
- **State Management**: Redux Toolkit / Zustand
- **Gaze Tracking**: WebGazer.js
- **Speech Recognition**: Web Speech API
- **Data Visualization**: Recharts / Chart.js
- **Video Processing**: React Webcam

#### Backend
- **Framework**: Node.js + Express / Python FastAPI
- **Authentication**: JWT + bcrypt
- **Database**: PostgreSQL (primary) + MongoDB (analytics)
- **ORM**: Prisma / Sequelize (Node.js) atau SQLAlchemy (Python)
- **File Storage**: AWS S3 / Local Storage
- **Real-time**: Socket.io / WebSocket

#### AI/ML Models
- **Eye Tracking Analysis**: TensorFlow.js / MediaPipe
- **Speech Analysis**: 
  - Speech-to-Text: Web Speech API / Whisper API
  - Fluency Analysis: Custom ML model
- **Reading Difficulty Assessment**: Scikit-learn / TensorFlow
- **Recommendation System**: Collaborative Filtering + Content-based

#### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston / ELK Stack

## 👥 User Roles

### 1. Siswa
- Melakukan kalibrasi pergerakan mata
- Mengikuti asesmen membaca
- Melihat profil kesulitan fonologi
- Menerima rekomendasi pembelajaran
- Mengikuti latihan interaktif
- Melakukan re-assessment

### 2. Guru  
- Melihat profil kesulitan siswa
- Monitoring pembelajaran siswa
- Melihat hasil asesmen
- Memberikan intervensi membaca
- Mengelola konten pembelajaran
- Memantau efektivitas intervensi

### 3. Orang Tua
- Melihat profil kesulitan anak
- Monitoring perkembangan anak
- Melihat hasil asesmen & latihan
- Memantau konsistensi belajar
- Memantau aktivitas belajar
- Memantau respons anak
- Mendukung latihan membaca anak
- Mengikuti rekomendasi pendamping

### 4. Admin
- Manajemen pengguna (CRUD semua role)
- Menambahkan pengguna
- Mengatur hak akses pengguna
- Mengelola konten pembelajaran
- Mengelola materi pembelajaran
- Mengelola model & versi AI
- Mengelola sistem
- Mengelola data sistem
- Mengelola pengaturan umum
- Memantau keamanan sistem

## 📊 Fitur Utama

### 1. **Gaze Tracking & Analysis**
- Kalibrasi eye tracking
- Real-time gaze detection
- Fixation duration analysis
- Saccade pattern recognition
- Reading path visualization

### 2. **Speech Analysis**
- Real-time speech-to-text
- Pronunciation accuracy
- Reading fluency measurement
- Pause pattern analysis
- Error detection & classification

### 3. **AI Assessment Engine**
- Multimodal data fusion (gaze + speech)
- Reading difficulty profiling
- Phonological awareness assessment
- Dyslexia risk detection
- Progress tracking over time

### 4. **Adaptive Learning System**
- Personalized content recommendation
- Difficulty level adjustment
- Interactive reading exercises
- Gamification elements
- Real-time feedback

### 5. **Dashboard & Analytics**
- Student progress monitoring
- Class-level analytics (for teachers)
- Parent dashboard with insights
- Admin analytics & reporting
- Data export functionality

## 📁 Struktur Proyek

```
CORTEXIA/
├── frontend/                    # React application
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── features/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── assessment/
│   │   │   ├── gaze-tracking/
│   │   │   ├── speech-analysis/
│   │   │   ├── dashboard/
│   │   │   └── learning/
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API services
│   │   ├── store/              # Redux store
│   │   ├── utils/              # Utilities
│   │   └── types/              # TypeScript types
│   └── package.json
│
├── backend/                     # Node.js/Python backend
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── models/             # Database models
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Custom middleware
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helper functions
│   │   └── config/             # Configuration
│   └── package.json
│
├── ai-models/                   # ML/AI models
│   ├── gaze-analysis/          # Eye tracking models
│   ├── speech-analysis/        # Speech processing
│   ├── assessment/             # Assessment models
│   ├── recommendation/         # Recommendation system
│   └── training/               # Model training scripts
│
├── database/                    # Database schemas
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── docs/                        # Documentation
│   ├── api/                    # API documentation
│   ├── architecture/           # System architecture
│   └── user-guides/            # User manuals
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ atau Python 3.9+
- PostgreSQL 14+
- MongoDB 5+ (optional, for analytics)
- Docker & Docker Compose (recommended)

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd CORTEXIA
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run migrate
npm run seed
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

4. **Using Docker (Recommended)**
```bash
docker-compose up -d
```

## 🔒 Security Considerations

- JWT-based authentication dengan refresh tokens
- Password hashing menggunakan bcrypt
- Role-based access control (RBAC)
- Input validation & sanitization
- Rate limiting untuk API endpoints
- HTTPS enforcement
- CORS configuration
- SQL injection prevention
- XSS protection
- CSRF protection

## 📈 Roadmap

### Phase 1 (Current)
- [ ] Setup project structure
- [ ] Authentication system
- [ ] Basic gaze tracking
- [ ] Speech recognition
- [ ] Student dashboard

### Phase 2
- [ ] AI assessment engine
- [ ] Teacher dashboard
- [ ] Parent dashboard
- [ ] Admin panel
- [ ] Analytics & reporting

### Phase 3
- [ ] Advanced ML models
- [ ] Adaptive learning algorithms
- [ ] Gamification features
- [ ] Mobile app (React Native)
- [ ] API for third-party integration

## 👨‍💻 Development Team

- **Project Lead**: [Name]
- **Frontend Developer**: [Name]
- **Backend Developer**: [Name]
- **ML Engineer**: [Name]
- **UI/UX Designer**: [Name]

## 📝 License

[To be determined]

## 📧 Contact

For questions and support, please contact: [email]

---

**Version**: 1.0.0  
**Last Updated**: September 2026  
**Status**: In Development

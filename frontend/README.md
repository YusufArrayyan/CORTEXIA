# CORTEXIA Frontend

Frontend aplikasi CORTEXIA - Multimodal AI-Based Reading Difficulty Profiling System menggunakan React, TypeScript, dan Material-UI.

## 🚀 Technology Stack

- **Framework**: React 18+ dengan TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Build Tool**: Vite
- **Gaze Tracking**: WebGazer.js
- **Speech Recognition**: Web Speech API
- **Real-time**: Socket.io-client
- **Charts**: Recharts
- **HTTP Client**: Axios

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   │   ├── teacher/    # Teacher-specific components
│   │   └── parent/     # Parent-specific components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── layouts/        # Page layouts
│   ├── pages/          # Page components
│   │   ├── auth/       # Login, Register
│   │   ├── student/    # Student dashboard & assessment
│   │   ├── teacher/    # Teacher dashboard (placeholder)
│   │   ├── parent/     # Parent dashboard (placeholder)
│   │   └── admin/      # Admin dashboard
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point
│   └── theme.ts        # MUI theme configuration
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ dan npm/yarn
- Backend API running di http://localhost:5000
- AI Engine running di http://localhost:8000

### Installation Steps

1. **Install dependencies**:
```bash
npm install
```

2. **Setup environment variables**:
```bash
cp .env.example .env
```

Edit `.env` sesuai konfigurasi backend Anda.

3. **Run development server**:
```bash
npm run dev
```

Aplikasi akan berjalan di http://localhost:3000

4. **Build for production**:
```bash
npm run build
```

5. **Preview production build**:
```bash
npm run preview
```

## 📱 Features

### 1. Authentication System
- Login/Register dengan role-based access
- JWT token management
- Protected routes
- Auto-refresh token

### 2. Student Features
- Dashboard dengan progress tracking
- Assessment session dengan gaze & speech tracking
- Real-time calibration
- Progress visualization
- Achievement system

### 3. Teacher Dashboard
- Class management
- Student monitoring
- Assessment review
- Learning path creation
- Intervention scheduling

### 4. Parent Dashboard
- Child progress monitoring
- Assessment insights
- Home practice recommendations
- Communication with teacher

### 5. Admin Dashboard
- User management (CRUD)
- Class management
- System monitoring
- Analytics & reporting
- Bulk operations

## 🎨 UI Components

### Core Components

1. **GazeCalibration**: Kalibrasi pelacakan mata 9-point
2. **GazeOverlay**: Visualisasi real-time gaze tracking
3. **GazeHeatmap**: Heatmap area fokus mata
4. **SpeechRecorder**: Perekaman dan analisis ucapan
5. **PronunciationResults**: Hasil analisis pelafalan
6. **AssessmentSession**: Orchestrator sesi assessment lengkap

### Layout Components

1. **DashboardLayout**: Layout dengan sidebar navigation
2. **AuthLayout**: Layout untuk halaman login/register

## 🔐 Authentication

### Demo Accounts

```javascript
// Teacher
email: teacher@cortexia.id
password: teacher123

// Parent
email: parent@cortexia.id
password: parent123

// Student
email: student@cortexia.id
password: student123

// Admin
email: admin@cortexia.id
password: admin123
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript type checking
```

## 🌐 API Integration

API services terletak di `src/services/`:

- `authService.ts`: Authentication API
- `gazeDataService.ts`: Gaze tracking data
- `speechDataService.ts`: Speech analysis data
- `teacherService.ts`: Teacher dashboard API
- `parentService.ts`: Parent dashboard API

Semua service menggunakan Axios dengan interceptor untuk:
- Auto-attach JWT token
- Handle 401 (refresh token)
- Global error handling

## 📦 Key Dependencies

```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "@mui/material": "^5.15.0",
  "@reduxjs/toolkit": "^2.0.0",
  "webgazer": "^3.0.0",
  "socket.io-client": "^4.6.0",
  "axios": "^1.6.0",
  "recharts": "^2.10.0"
}
```

## 🔧 Configuration

### Vite Config

- Port: 3000
- Proxy: `/api` → `http://localhost:5000`
- Hot Module Replacement (HMR)
- Code splitting

### Theme Config

Material-UI theme dikonfigurasi di `src/theme.ts`:
- Primary color: #1976d2 (Blue)
- Secondary color: #dc004e (Pink)
- Typography: Roboto
- Custom breakpoints
- Dark mode support

## 🚨 Browser Requirements

- Chrome/Edge 90+ (recommended untuk gaze tracking)
- Firefox 88+
- Safari 14+
- Webcam & microphone access
- HTTPS untuk production (required untuk webcam/mic)

## 📝 Development Notes

### Gaze Tracking
- WebGazer.js memerlukan kalibrasi awal
- Performa optimal di kondisi pencahayaan baik
- Face tracking menggunakan browser's native APIs

### Speech Recognition
- Web Speech API support bahasa Indonesia
- Performa tergantung koneksi internet (online recognition)
- Fallback ke offline recognition jika tersedia

### Real-time Updates
- Socket.io untuk real-time communication
- Auto-reconnect on disconnect
- Event-based architecture

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests & linting
4. Submit pull request

## 📄 License

Proprietary - CORTEXIA System © 2026

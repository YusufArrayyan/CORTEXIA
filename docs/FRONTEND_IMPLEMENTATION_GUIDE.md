# CORTEXIA Frontend Implementation Guide

## Overview

Dokumentasi lengkap implementasi frontend CORTEXIA dengan React + TypeScript + Material-UI, mencakup routing, authentication, layouts, dan semua halaman dashboard untuk 4 role (Student, Teacher, Parent, Admin).

## 📂 Project Structure

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── components/              # Reusable components
│   │   ├── GazeCalibration.tsx
│   │   ├── GazeOverlay.tsx
│   │   ├── GazeHeatmap.tsx
│   │   ├── AssessmentSession.tsx
│   │   ├── SpeechRecorder.tsx
│   │   ├── PronunciationResults.tsx
│   │   ├── SpeechAssessmentSession.tsx
│   │   ├── teacher/             # Teacher components
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── ClassDetails.tsx
│   │   │   └── StudentDetailView.tsx
│   │   └── parent/              # Parent components
│   │       ├── ParentDashboard.tsx
│   │       └── ChildDetailView.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── hooks/
│   │   ├── useGazeTracking.ts
│   │   └── useSpeechRecognition.ts
│   ├── layouts/
│   │   ├── DashboardLayout.tsx  # Main layout with sidebar
│   │   └── AuthLayout.tsx       # Layout for auth pages
│   ├── pages/
│   │   ├── LandingPage.tsx      # Public landing page
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── student/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── TakeAssessment.tsx
│   │   │   └── MyProgress.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── UserManagement.tsx
│   │       ├── ClassManagement.tsx
│   │       └── SystemMonitoring.tsx
│   ├── services/
│   │   ├── gazeDataService.ts
│   │   ├── speechDataService.ts
│   │   ├── teacherService.ts
│   │   └── parentService.ts
│   ├── types/
│   │   ├── gaze.types.ts
│   │   ├── speech.types.ts
│   │   ├── teacher.types.ts
│   │   └── parent.types.ts
│   ├── utils/
│   │   ├── wordTracker.ts
│   │   ├── pronunciationAnalyzer.ts
│   │   └── audioRecorder.ts
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point
│   └── theme.ts                 # MUI theme configuration
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 🎨 Design System

### Theme Configuration (`theme.ts`)

```typescript
- Primary Color: #1976d2 (Blue)
- Secondary Color: #dc004e (Pink)
- Success Color: #2e7d32 (Green)
- Warning Color: #ed6c02 (Orange)
- Error Color: #d32f2f (Red)
- Info Color: #0288d1 (Light Blue)
- Typography: Roboto Font Family
- Border Radius: 8px default
- Spacing: 8px base unit
```

### Layout System

#### 1. DashboardLayout
- **Persistent Sidebar** (240px width)
- **Dynamic Navigation** berdasarkan user role
- **AppBar** dengan user info & logout
- **Breadcrumb** navigation
- **Responsive** - sidebar collapse di mobile

#### 2. AuthLayout
- **Centered Card** design
- **Logo** & branding
- **Responsive** single column
- **Clean** minimal design

## 🔐 Authentication Flow

### AuthContext Provider

**Location**: `src/contexts/AuthContext.tsx`

**Features**:
- JWT token management (localStorage)
- Auto-refresh token
- User state management
- Login/Logout/Register methods
- Protected route logic

**Usage**:
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

### Protected Routes

Semua route kecuali `/`, `/login`, `/register` require authentication.

Role-based routing:
- `/student/*` → Student only
- `/teacher/*` → Teacher only
- `/parent/*` → Parent only
- `/admin/*` → Admin only

## 📄 Pages Implementation

### 1. Landing Page (`/`)

**File**: `pages/LandingPage.tsx`

**Features**:
- Hero section dengan CTA
- Feature highlights (3 cards)
- Responsive design
- Redirect to login button

**Sections**:
1. Hero: Judul + subtitle + CTA button
2. Features: Gaze Tracking, Speech Analysis, AI Assessment
3. Call to Action

---

### 2. Login Page (`/login`)

**File**: `pages/auth/LoginPage.tsx`

**Features**:
- Email & password form
- Demo credentials display
- Link to register
- Error handling
- Auto-redirect after login

**Demo Accounts**:
```
Teacher:  teacher@cortexia.id / teacher123
Parent:   parent@cortexia.id / parent123
Student:  student@cortexia.id / student123
Admin:    admin@cortexia.id / admin123
```

---

### 3. Register Page (`/register`)

**File**: `pages/auth/RegisterPage.tsx`

**Features**:
- Full registration form
- Role selection
- Password confirmation
- Link to login
- Form validation

---

### 4. Student Dashboard (`/student/dashboard`)

**File**: `pages/student/StudentDashboard.tsx`

**Features**:
- Welcome message dengan user name
- 4 stat cards:
  - Latihan Selesai
  - Kemajuan (%)
  - Prestasi
  - Hari Belajar
- Quick actions:
  - Mulai Latihan Membaca
  - Lihat Materi Tersimpan
- Progress mingguan (linear progress bar)
- Recent achievements list

**UI Components**:
- Grid layout (4 columns)
- Card-based stats
- Alert untuk motivasi
- Achievement badges

---

### 5. Take Assessment (`/student/take-assessment`)

**File**: `pages/student/TakeAssessment.tsx`

**Features**:
- Multi-step wizard (Stepper)
- 4 steps:
  1. **Persiapan**: Checklist persiapan
  2. **Kalibrasi Mata**: Gaze calibration placeholder
  3. **Latihan Membaca**: Reading material + speech recording
  4. **Selesai**: Summary & feedback

**Integration Points**:
- GazeCalibration component (step 2)
- SpeechRecorder component (step 3)
- Real reading material display

---

### 6. My Progress (`/student/my-progress`)

**File**: `pages/student/MyProgress.tsx`

**Features**:
- 3 overview cards:
  - Kemajuan Keseluruhan (80%)
  - Total Hari Belajar
  - Prestasi Diraih
- 3 tabs:
  1. **Kemampuan**: 4 skill progress bars
     - Pelafalan
     - Kecepatan Membaca
     - Pemahaman
     - Fokus Mata
  2. **Riwayat Latihan**: List recent sessions
  3. **Prestasi**: Achievement cards grid

**Data Visualization**:
- Linear progress bars
- Status chips
- Achievement icons/emoji

---

### 7. Teacher Dashboard

**File**: `components/teacher/TeacherDashboard.tsx`

**Features** (dari Task #8):
- Class overview dengan stats
- Student list dengan status
- Recent assessments
- Quick actions
- Analytics charts

---

### 8. Parent Dashboard

**File**: `components/parent/ParentDashboard.tsx`

**Features** (dari Task #9):
- Child progress overview
- Recent assessment results
- Recommended home activities
- Communication tools

---

### 9. Admin Dashboard (`/admin/dashboard`)

**File**: `pages/admin/AdminDashboard.tsx`

**Features**:
- 4 stat cards:
  - Total Pengguna (1247)
  - Kelas Aktif (45)
  - Asesmen Bulan Ini (3421)
  - Tingkat Keberhasilan (87%)
- Recent activities table
- System health status
- Quick action buttons

**Sections**:
1. Stats overview
2. Recent activities (4 rows)
3. System health monitor (4 services)
4. Quick actions (4 buttons)

---

### 10. User Management (`/admin/users`)

**File**: `pages/admin/UserManagement.tsx`

**Features**:
- Search bar
- User table dengan pagination
- Role badges (Admin, Guru, Orang Tua, Siswa)
- Status chips (Aktif/Nonaktif)
- Context menu (Edit, Block, Delete)
- Add user dialog

**Table Columns**:
1. Pengguna (avatar + name)
2. Email
3. Role (chip)
4. Status (chip)
5. Login Terakhir
6. Aksi (menu)

---

### 11. Class Management (`/admin/classes`)

**File**: `pages/admin/ClassManagement.tsx`

**Features**:
- 4 summary cards:
  - Total Kelas
  - Total Siswa
  - Asesmen Aktif
  - Rata-rata Progress
- Class cards grid (3 columns)
- Each card shows:
  - Class name & grade
  - Teacher name
  - Student count
  - Active assessments
  - Average progress
  - Student avatars
- Add class dialog
- Context menu per class

**Actions**:
- Add new class
- Edit class
- Manage students
- Delete class

---

### 12. System Monitoring (`/admin/system-monitoring`)

**File**: `pages/admin/SystemMonitoring.tsx`

**Features**:
- 4 metric cards:
  - Server Uptime (99.9%)
  - Database Size (24.5 GB)
  - Avg Response Time (45ms)
  - Security Score (95/100)
- 3 tabs:
  1. **Status Layanan**: 6 services table
     - Backend API
     - AI Engine
     - WebSocket Server
     - PostgreSQL
     - MongoDB
     - Redis Cache
  2. **Performa**: 6 performance metrics
     - CPU Usage
     - Memory Usage
     - Disk I/O
     - Network Traffic
     - Active Connections
     - Queue Size
  3. **Log Sistem**: Recent logs table
     - Time
     - Level (info/warning/error)
     - Service
     - Message

**Visualization**:
- Linear progress bars
- Status chips dengan icons
- Color-coded alerts

---

## 🔄 Routing Structure

```typescript
/ (Public)
  └─ LandingPage

/login (Public)
  └─ LoginPage

/register (Public)
  └─ RegisterPage

/student (Protected - Student Role)
  ├─ /dashboard
  ├─ /take-assessment
  └─ /my-progress

/teacher (Protected - Teacher Role)
  ├─ /dashboard
  ├─ /classes
  └─ /students

/parent (Protected - Parent Role)
  ├─ /dashboard
  └─ /children

/admin (Protected - Admin Role)
  ├─ /dashboard
  ├─ /users
  ├─ /classes
  └─ /system-monitoring
```

## 🎯 Key Features Implementation

### 1. Responsive Design

Semua pages menggunakan MUI Grid system:
- **xs**: Mobile (< 600px)
- **sm**: Tablet (≥ 600px)
- **md**: Desktop (≥ 900px)
- **lg**: Large Desktop (≥ 1200px)

### 2. Navigation

**Sidebar Navigation** (DashboardLayout):
- Dynamic menu berdasarkan role
- Active state highlighting
- Icons dari Material Icons
- Collapse pada mobile

**Menu Items**:

**Student**:
- Dashboard
- Ambil Latihan
- Perkembanganku
- Materi Belajar

**Teacher**:
- Dashboard
- Kelas Saya
- Daftar Siswa
- Bank Materi

**Parent**:
- Dashboard
- Anak Saya
- Aktivitas Rumah

**Admin**:
- Dashboard
- Manajemen User
- Manajemen Kelas
- Monitoring Sistem
- Laporan

### 3. State Management

**Local State**: useState untuk UI state
**Context**: AuthContext untuk authentication
**Future**: Redux Toolkit untuk global app state

### 4. Data Fetching

**Services Pattern**:
```typescript
// Example: teacherService.ts
export const teacherService = {
  getDashboardData: () => api.get('/teacher/dashboard'),
  getClasses: () => api.get('/teacher/classes'),
  // ...
};
```

**Axios Interceptors**:
- Auto-attach JWT token
- Handle 401 (refresh token)
- Global error handling

### 5. Error Handling

- Try-catch blocks di async functions
- User-friendly error messages
- Fallback UI components
- Loading states

## 🧩 Component Reusability

### Shared Components

1. **StatCard**: Reusable stat display
2. **StatusChip**: Color-coded status
3. **UserAvatar**: User avatar dengan fallback
4. **DataTable**: Table dengan pagination
5. **EmptyState**: No data placeholder

### MUI Components Used

- Box, Container, Grid
- Card, CardContent
- Typography, Button, IconButton
- TextField, Select, MenuItem
- Table, TableRow, TableCell
- Tabs, Tab, TabPanel
- Dialog, DialogTitle, DialogContent
- Alert, Chip, Avatar
- LinearProgress
- Menu, MenuItem

## 🔧 Configuration Files

### 1. vite.config.ts
- React plugin
- Path aliases (@/ → src/)
- Proxy configuration
- Build optimization

### 2. tsconfig.json
- Strict mode enabled
- Path mapping
- ES2020 target
- JSX: react-jsx

### 3. .eslintrc.cjs
- TypeScript ESLint
- React hooks rules
- React refresh plugin

### 4. .env.example
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_AI_API_URL=http://localhost:8000
```

## 📦 Build & Deployment

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Output
- **dist/** folder
- Optimized assets
- Code splitting
- Source maps

## ✅ Completion Checklist

- [x] Project structure setup
- [x] Theme configuration
- [x] Routing implementation (React Router)
- [x] Authentication context
- [x] Protected routes
- [x] Layouts (Dashboard + Auth)
- [x] Landing page
- [x] Login page
- [x] Register page
- [x] Student dashboard
- [x] Student assessment page
- [x] Student progress page
- [x] Admin dashboard
- [x] User management
- [x] Class management
- [x] System monitoring
- [x] Responsive design
- [x] Navigation system
- [x] Entry point (main.tsx)
- [x] HTML template
- [x] Vite configuration
- [x] TypeScript configuration
- [x] ESLint configuration
- [x] Environment variables
- [x] Documentation

## 🚀 Next Steps (Task #12)

1. **Testing & Integration**:
   - Unit tests untuk components
   - Integration tests untuk flows
   - E2E tests dengan Playwright/Cypress
   - API integration testing

2. **Performance Optimization**:
   - Code splitting optimization
   - Image optimization
   - Lazy loading
   - Bundle size analysis

3. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - Color contrast validation

4. **Production Deployment**:
   - Environment configuration
   - CI/CD pipeline
   - Error monitoring (Sentry)
   - Analytics integration

## 📝 Notes

- Teacher & Parent dashboard sudah diimplementasi di Task #8 & #9 sebagai component, bisa diintegrasikan ke routing
- Semua pages menggunakan placeholder data, siap untuk integrasi dengan backend API
- WebGazer.js dan Web Speech API sudah diimplementasi di Task #4 & #5
- Design mengikuti Material Design guidelines
- Semua text dalam Bahasa Indonesia sesuai target user

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [React Router Documentation](https://reactrouter.com)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vite Documentation](https://vitejs.dev)

---

**Task #11 Status**: ✅ **COMPLETED**

**Completed By**: AI Assistant
**Date**: September 21, 2026
**Total Files Created**: 25+ files

# Parent Dashboard Guide

## Overview

Parent Dashboard adalah antarmuka khusus untuk orang tua dalam sistem CORTEXIA. Dashboard ini memberikan akses lengkap untuk memantau perkembangan anak, memahami hasil assessment, berkomunikasi dengan guru, dan mendapatkan rekomendasi aktivitas di rumah.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Usage Examples](#usage-examples)
6. [Parent Resources](#parent-resources)
7. [Best Practices](#best-practices)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                Parent Dashboard                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Dashboard │  │   Child    │  │Assessment  │   │
│  │  Overview  │  │   Details  │  │ Insights   │   │
│  └────────────┘  └────────────┘  └────────────┘   │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Progress  │  │   Home     │  │Milestones &│   │
│  │  Tracking  │  │  Practice  │  │Achievements│   │
│  └────────────┘  └────────────┘  └────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────┐
    │  Backend API  │
    │  (Express)    │
    └───────────────┘
```

### Key Features

1. **Child Monitoring**: Pantau perkembangan semua anak
2. **Assessment Insights**: Hasil assessment dalam bahasa yang mudah dipahami
3. **Progress Tracking**: Visualisasi progress dengan charts
4. **Home Practice**: Rekomendasi aktivitas di rumah
5. **Teacher Communication**: View feedback dari guru
6. **Milestones**: Track pencapaian dan milestone
7. **Resources**: Akses materi dan tips untuk orang tua

---

## Features

### 1. Parent Dashboard Overview

**Fitur:**
- Summary metrics (jumlah anak, dalam program, perlu perhatian, jadwal)
- Card per anak dengan status, progress, dan last assessment
- Alert untuk feedback baru dari guru
- Tips untuk orang tua

**Metrics Displayed:**
- Total children
- Children with active learning path
- Children needing attention (MODERATE/SEVERE difficulty)
- Upcoming interventions
- Recent teacher feedback (last 30 days)

### 2. Child Detail View

**Fitur:**
- Profil anak lengkap (nama, kelas, guru)
- Status dan progress current
- 4 tabs: Progress, Latihan di Rumah, Pencapaian, Feedback Guru

**Tabs:**
- **Progress**: Chart perkembangan, skill progress per kategori
- **Latihan di Rumah**: Aktivitas harian, target mingguan, kata latihan, tips
- **Pencapaian**: Achievement badges, milestone timeline
- **Feedback Guru**: List feedback dari guru (public only)

### 3. Assessment Insights (Parent-Friendly)

**Fitur:**
- Hasil assessment disederhanakan untuk orang tua
- Skill breakdown dengan deskripsi mudah dipahami
- Parent tips per skill
- Challenging words yang perlu latihan
- Home practice activities recommendation

**Skill Descriptions (Parent-Friendly):**
- **Decoding** → Pengenalan kata
- **Fluency** → Kelancaran membaca
- **Comprehension** → Pemahaman bacaan
- **Attention** → Fokus saat membaca

**Difficulty Levels:**
- **NONE** → Sangat Baik ✅
- **MILD** → Perlu Latihan ⚠️
- **MODERATE** → Perlu Perhatian ⚠️⚠️
- **SEVERE** → Perlu Bantuan Intensif 🚨

### 4. Progress Tracking

**Fitur:**
- Timeline chart (90 days default)
- Overall trend (improving/stable/declining)
- Skill-specific progress
- Practice sessions log
- Assessment count

### 5. Home Practice Recommendations

**Components:**
- **Daily Activities**: 
  * Membaca bersama (15-20 menit)
  * Latihan kata (10 menit)
  
- **Weekly Goals**: 
  * Skill-specific targets
  * Recommended activities
  
- **Practice Words**: 
  * List kata-kata sulit dari assessment
  
- **Parenting Tips**: 
  * Guidance sesuai difficulty level anak
  
- **Resources**: 
  * PDF guides, videos, book recommendations

### 6. Teacher Feedback View

**Fitur:**
- List semua feedback publik dari guru
- Feedback types: PROGRESS, CONCERN, PRAISE, RECOMMENDATION, NOTE
- Linked to related assessments
- Sorted by date (newest first)

### 7. Milestones & Achievements

**Milestones:**
- Tracked automatically dari learning path
- Status: achieved atau pending
- Linked to specific skills
- Timeline display

**Achievements:**
- 🏆 Badge untuk pencapaian special
- 5+ milestones → "Pencapaian 5 Milestone"
- 50% progress → "Setengah Perjalanan"
- More strengths than weaknesses → "Kekuatan Berlimpah"

---

## API Endpoints

### Dashboard & Overview

#### GET /api/parent/dashboard
Get parent dashboard overview dengan semua anak.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalChildren": 2,
      "childrenWithActivePath": 2,
      "childrenNeedingAttention": 1,
      "recentFeedback": 5,
      "upcomingInterventions": 3
    },
    "children": [
      {
        "id": 10,
        "fullName": "Ahmad Rizki",
        "class": {
          "id": 1,
          "name": "Kelas 1A",
          "grade": "1",
          "teacher": {
            "user": {
              "fullName": "Ibu Sarah",
              "email": "sarah@teacher.com"
            }
          }
        },
        "currentStatus": "MILD",
        "progress": 45,
        "lastAssessment": {
          "id": 1,
          "overallDifficulty": "MILD",
          "confidence": 0.85,
          "createdAt": "2024-01-15T10:30:00Z"
        }
      }
    ]
  }
}
```

### Child Management & Monitoring

#### GET /api/parent/children/:childId
Get comprehensive child details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 10,
    "user": {
      "fullName": "Ahmad Rizki",
      "email": "ahmad@student.com"
    },
    "class": {
      "name": "Kelas 1A",
      "grade": "1",
      "teacher": {
        "user": {
          "fullName": "Ibu Sarah"
        }
      }
    },
    "learningPaths": [...],
    "assessments": [...],
    "feedback": [...],
    "analytics": {
      "overallProgress": 45,
      "progressTrend": "improving",
      "skillProgress": {...},
      "strengths": ["Good pronunciation"],
      "weaknesses": ["Reading speed"],
      "milestones": [...]
    }
  }
}
```

#### GET /api/parent/children/:childId/progress?period=90
Get child progress over time.

**Query Parameters:**
- `period` (optional): Jumlah hari, default 90

**Response:**
```json
{
  "success": true,
  "data": {
    "period": 90,
    "assessmentCount": 8,
    "overallTrend": "improving",
    "skillProgress": [
      {
        "skillName": "Decoding",
        "averageScore": 0.75,
        "trend": "improving",
        "latestScore": 0.80
      }
    ],
    "timeline": [
      {
        "date": "2024-01-10",
        "difficulty": "MILD",
        "confidence": 0.82
      }
    ],
    "practiceSessions": [
      {
        "date": "2024-01-11",
        "skill": "Fluency",
        "performance": 0.75,
        "feedback": "Good progress!"
      }
    ]
  }
}
```

### Assessment Insights

#### GET /api/parent/children/:childId/assessments/:assessmentId
Get simplified assessment insights untuk orang tua.

**Response:**
```json
{
  "success": true,
  "data": {
    "assessmentDate": "2024-01-15T10:30:00Z",
    "overallStatus": "MILD",
    "confidence": 0.85,
    "skillBreakdown": [
      {
        "skillName": "Decoding",
        "level": "MILD",
        "score": 0.75,
        "description": "Anak Anda cukup baik dalam mengenali kata, tapi perlu latihan lebih.",
        "parentTips": [
          "Latih membaca kata-kata baru setiap hari",
          "Gunakan kartu kata untuk praktek"
        ]
      }
    ],
    "challengingWords": [
      {
        "word": "komputer",
        "issues": ["high_fixations", "mispronunciation"]
      }
    ],
    "recommendations": [
      "Latihan membaca rutin 15 menit per hari",
      "Fokus pada kata-kata yang sulit"
    ],
    "homePracticeActivities": [
      {
        "title": "Membaca Bersama",
        "description": "Baca bersama anak 15-20 menit setiap hari",
        "frequency": "Harian"
      }
    ]
  }
}
```

### Home Practice & Recommendations

#### GET /api/parent/children/:childId/home-practice
Get home practice recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "daily": [
      {
        "activity": "Membaca bersama",
        "duration": "15-20 menit",
        "tips": "Pilih buku yang menarik untuk anak"
      }
    ],
    "weekly": [
      {
        "skill": "Fluency",
        "goal": "Tingkatkan Fluency sebesar 10%",
        "activities": [
          "Latihan membaca dengan timer",
          "Baca cerita favorit berulang kali"
        ]
      }
    ],
    "practiceWords": ["komputer", "sekolah", "membaca"],
    "tips": [
      "Buat rutinitas membaca yang konsisten",
      "Berikan pujian untuk setiap kemajuan",
      "Pilih buku yang sesuai minat anak"
    ],
    "resources": [
      {
        "title": "Panduan Orang Tua: Mendukung Anak Belajar Membaca",
        "type": "PDF",
        "url": "/resources/parent-guide.pdf"
      }
    ]
  }
}
```

### Teacher Communication

#### GET /api/parent/children/:childId/feedback
Get teacher feedback (public only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "teacherId": 2,
      "studentId": 10,
      "type": "PROGRESS",
      "content": "Ahmad menunjukkan peningkatan signifikan dalam kecepatan membaca. Pertahankan latihan rutin!",
      "isPrivate": false,
      "createdAt": "2024-01-20T15:00:00Z",
      "teacher": {
        "user": {
          "fullName": "Ibu Sarah",
          "email": "sarah@teacher.com"
        }
      },
      "relatedAssessment": {
        "id": 1,
        "createdAt": "2024-01-15T10:30:00Z",
        "overallDifficulty": "MILD"
      }
    }
  ]
}
```

### Interventions & Support

#### GET /api/parent/children/:childId/interventions
Get upcoming interventions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "GUIDED_READING",
      "description": "30-minute guided reading session focused on fluency",
      "scheduledDate": "2024-01-25T10:00:00Z",
      "duration": 30,
      "status": "PENDING",
      "learningModule": {
        "skillName": "Fluency"
      }
    }
  ]
}
```

### Milestones & Achievements

#### GET /api/parent/children/:childId/milestones
Get milestones and achievements.

**Response:**
```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "date": "2024-01-10",
        "description": "Completed 10 reading sessions",
        "skillName": "Fluency",
        "achieved": true
      }
    ],
    "achievements": [
      {
        "title": "Pencapaian 5 Milestone",
        "icon": "🏆",
        "description": "Menyelesaikan 5 milestone"
      }
    ]
  }
}
```

---

## Frontend Components

### 1. ParentDashboard.tsx

Main dashboard dengan overview semua anak.

**Features:**
- Summary cards dengan metrics
- Child cards dengan progress bars
- Status chips dengan color coding
- Tips section untuk orang tua
- Navigation ke child detail

**Dependencies:**
- Material-UI components
- parentService untuk API calls

### 2. ChildDetailView.tsx

Detailed view per anak dengan charts dan tabs.

**Features:**
- 4 tabs comprehensive
- Line chart untuk progress timeline
- Skill progress bars
- Home practice recommendations
- Achievement badges
- Feedback list

**Dependencies:**
- Chart.js untuk line chart
- Material-UI components
- parentService

---

## Parent Resources

### Reading Tips by Difficulty Level

**NONE (Sangat Baik):**
- Terus berikan tantangan membaca yang lebih sulit
- Dorong anak untuk membaca berbagai jenis buku
- Diskusikan buku yang dibaca untuk meningkatkan pemahaman

**MILD (Perlu Latihan):**
- Buat rutinitas membaca yang konsisten
- Berikan pujian untuk setiap kemajuan
- Pilih buku yang sesuai minat anak

**MODERATE (Perlu Perhatian):**
- Bersabar dan berikan dukungan positif
- Jangan memaksakan jika anak lelah
- Rayakan pencapaian kecil
- Komunikasi rutin dengan guru

**SEVERE (Perlu Bantuan Intensif):**
- Fokus pada progress, bukan kesempurnaan
- Ciptakan pengalaman membaca yang menyenangkan
- Kerja sama erat dengan guru dan spesialis
- Konsisten dengan program yang diberikan

### Skill-Specific Tips

**Decoding (Pengenalan Kata):**
- Latih membaca kata-kata baru setiap hari
- Gunakan kartu kata untuk praktek
- Bantu anak mengeja kata dengan suara keras
- Gunakan buku bergambar untuk bantuan visual

**Fluency (Kelancaran):**
- Baca cerita favorit berulang kali
- Dengarkan audiobook bersama
- Praktek membaca dengan timer
- Baca bergantian per paragraf

**Comprehension (Pemahaman):**
- Tanyakan tentang cerita setelah membaca
- Diskusikan karakter dan plot
- Baca per paragraf dan diskusikan
- Gunakan gambar untuk membantu pemahaman

**Attention (Fokus):**
- Buat rutinitas membaca yang konsisten
- Pilih waktu ketika anak paling fokus
- Baca di tempat yang tenang
- Gunakan timer untuk sesi pendek
- Mulai dengan sesi 5 menit
- Berikan reward untuk fokus yang baik

---

## Best Practices

### 1. For Parents

✅ **DO:**
- Check dashboard regularly (minimal 1x seminggu)
- Read all teacher feedback promptly
- Follow home practice recommendations
- Celebrate small achievements
- Communicate dengan guru jika ada concern
- Create consistent reading routine
- Make reading fun, not stressful

❌ **DON'T:**
- Compare your child dengan anak lain
- Force reading when child is tired atau unwilling
- Ignore teacher feedback atau recommendations
- Skip daily reading practice
- Focus only on weaknesses (celebrate strengths too!)
- Use assessment results untuk punishment

### 2. Security & Privacy

✅ **DO:**
- Keep login credentials secure
- Logout dari shared devices
- Verify parent-child relationship via school

❌ **DON'T:**
- Share account dengan orang lain
- Access data untuk anak yang bukan milik Anda
- Screenshot atau share assessment data publicly

### 3. Communication

✅ **DO:**
- Read all feedback from teachers
- Contact teacher untuk clarification jika perlu
- Share home practice progress dengan guru
- Attend scheduled interventions
- Follow up on recommendations

❌ **DON'T:**
- Assume Anda memahami semua tanpa bertanya
- Ignore intervention schedules
- Wait too long untuk communicate concerns

---

## Usage Examples

### 1. View Dashboard

```typescript
import ParentDashboard from './components/parent/ParentDashboard';

function App() {
  return <ParentDashboard />;
}
```

### 2. View Child Details

```typescript
import { useParams } from 'react-router-dom';
import ChildDetailView from './components/parent/ChildDetailView';

function ChildPage() {
  const { childId } = useParams();
  return <ChildDetailView />;
}
```

### 3. Get Assessment Insights (Programmatic)

```typescript
import parentService from './services/parentService';

const viewAssessment = async (childId: number, assessmentId: number) => {
  const insights = await parentService.getAssessmentInsights(childId, assessmentId);
  
  console.log('Overall Status:', insights.overallStatus);
  console.log('Skill Breakdown:', insights.skillBreakdown);
  console.log('Home Activities:', insights.homePracticeActivities);
};
```

### 4. Track Progress

```typescript
const trackProgress = async (childId: number) => {
  const progress = await parentService.getChildProgress(childId, 90);
  
  console.log('Overall Trend:', progress.overallTrend);
  console.log('Assessment Count:', progress.assessmentCount);
  console.log('Skill Progress:', progress.skillProgress);
};
```

---

## Summary

Parent Dashboard menyediakan:

✅ Simple, parent-friendly interface  
✅ Clear progress visualization  
✅ Actionable home practice recommendations  
✅ Direct communication dengan guru  
✅ Achievement tracking untuk motivasi  
✅ Resources untuk mendukung anak di rumah  

**Production Ready:** Backend controllers, routes, validation ✓  
**Frontend Complete:** ParentDashboard, ChildDetailView components ✓  
**API Documented:** 8 endpoints dengan examples ✓  
**Type Safe:** Full TypeScript definitions ✓  
**Parent-Friendly:** Simplified language dan clear guidance ✓  

Ready untuk Task #10: Admin Dashboard!

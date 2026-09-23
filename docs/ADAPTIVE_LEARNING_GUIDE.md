# CORTEXIA Adaptive Learning System

## Overview

Sistem pembelajaran adaptif yang mempersonalisasi jalur belajar berdasarkan hasil assessment AI multimodal (gaze tracking + speech analysis).

## Fitur Utama

### 1. Personalized Learning Paths
- Jalur belajar disesuaikan dengan tingkat kesulitan
- Fokus area berdasarkan skill assessment
- Durasi dan frekuensi disesuaikan
- Target dan objektif yang jelas

### 2. Dynamic Difficulty Adjustment
- Penyesuaian otomatis berdasarkan performa
- Monitoring real-time
- Peningkatan bertahap (scaffolding)

### 3. Intelligent Material Recommendations
- Rekomendasi berdasarkan skill gaps
- Relevance scoring
- Hindari pengulangan materi

### 4. Progress Tracking
- Real-time monitoring
- Analytics dan trends
- Milestone tracking

### 5. Intervention Scheduling
- Intervensi tepat waktu
- Prioritas berdasarkan kesulitan
- Multi-level support (peer, teacher, specialist)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           AI Assessment Results                      │
│  (Difficulty, Skills, Difficult Words)              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│        Learning Path Generation                      │
│  • Select template based on difficulty              │
│  • Identify focus areas                             │
│  • Create learning modules                          │
│  • Schedule interventions                           │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Material Recommendations                     │
│  • Query by skill + difficulty                      │
│  • Calculate relevance scores                       │
│  • Filter completed materials                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          Student Activities                         │
│  • Practice exercises                               │
│  • Reading materials                                │
│  • Interactive lessons                              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Progress Tracking                           │
│  • Record performance                               │
│  • Calculate metrics                                │
│  • Update analytics                                 │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│      Dynamic Difficulty Adjustment                  │
│  • Analyze recent performance                       │
│  • Adjust module difficulty                         │
│  • Update recommendations                           │
└─────────────────────────────────────────────────────┘
```

## Learning Path Templates

### 1. No Difficulty (Score >= 0.8)
```javascript
{
  duration: 4 weeks,
  sessionsPerWeek: 2,
  materials: ['advanced', 'enrichment'],
  interventions: []
}
```
**Focus**: Enrichment dan challenge

### 2. Mild Difficulty (Score 0.6-0.8)
```javascript
{
  duration: 8 weeks,
  sessionsPerWeek: 3,
  materials: ['grade_level', 'practice'],
  interventions: ['targeted_practice', 'peer_support']
}
```
**Focus**: Penguatan dan latihan tambahan

### 3. Moderate Difficulty (Score 0.4-0.6)
```javascript
{
  duration: 12 weeks,
  sessionsPerWeek: 4,
  materials: ['below_grade', 'scaffolded', 'multisensory'],
  interventions: ['small_group', 'explicit_instruction', 'frequent_monitoring']
}
```
**Focus**: Instruksi eksplisit dan dukungan terstruktur

### 4. Severe Difficulty (Score < 0.4)
```javascript
{
  duration: 16 weeks,
  sessionsPerWeek: 5,
  materials: ['intensive', 'systematic', 'multisensory'],
  interventions: ['one_on_one', 'specialist', 'daily_practice', 'parent_training']
}
```
**Focus**: Intervensi intensif dan dukungan spesialis

## API Usage

### Generate Learning Path

```javascript
POST /api/adaptive-learning/generate-path

Request:
{
  "studentId": "student-123",
  "assessmentResults": {
    "overall_difficulty": "moderate",
    "overall_score": 0.55,
    "skill_assessments": [
      {
        "category": "decoding",
        "score": 0.45,
        "difficulty_level": "moderate",
        "recommendations": ["Phonics practice", "Word families"]
      }
    ],
    "difficult_words": [
      { "word": "because", "difficulty_score": 0.8 }
    ]
  }
}

Response:
{
  "success": true,
  "data": {
    "learningPath": {
      "id": "path-456",
      "duration": 12,
      "sessionsPerWeek": 4,
      "focusAreas": [...]
    },
    "modules": [...],
    "interventions": [...]
  }
}
```

### Get Recommendations

```javascript
GET /api/adaptive-learning/recommendations/:studentId?skill=decoding&limit=5

Response:
{
  "success": true,
  "data": {
    "materials": [
      {
        "id": "mat-789",
        "title": "Phonics Practice Level 2",
        "difficulty": "basic",
        "skills": ["decoding"],
        "relevanceScore": 85.5
      }
    ]
  }
}
```

### Track Progress

```javascript
POST /api/adaptive-learning/track-progress

Request:
{
  "studentId": "student-123",
  "activityId": "activity-456",
  "performanceData": {
    "score": 0.75,
    "accuracy": 0.8,
    "timeSpent": 900,
    "metrics": {
      "questionsAnswered": 10,
      "correctAnswers": 8
    }
  }
}
```

### Get Analytics

```javascript
GET /api/adaptive-learning/analytics/:studentId?timeRange=30d

Response:
{
  "success": true,
  "data": {
    "overview": {
      "totalActivities": 45,
      "averageScore": 0.72,
      "completionRate": 0.85
    },
    "skillProgress": {...},
    "trends": {...},
    "strengths": ["Fluency improving"],
    "challenges": ["Decoding needs work"]
  }
}
```

## Difficulty Adjustment Algorithm

```javascript
// Calculate performance score
performanceScore = (accuracy * 0.4 + speed * 0.3 + consistency * 0.3)

// Adjustment rules
if (performanceScore > 0.85 && allRecentScores > 0.8) {
  // Increase difficulty
  action = 'increase'
} 
else if (performanceScore < 0.5 && recentLowScores >= 3) {
  // Decrease difficulty
  action = 'decrease'
}
else {
  // Maintain current level
  action = 'maintain'
}
```

## Material Relevance Scoring

```javascript
relevanceScore = 
  (skillMatch * 20) +           // Skills yang cocok
  (difficultyMatch * 30) +      // Tingkat kesulitan sesuai
  (rating * 10) +               // Rating material
  (log(usageCount + 1) * 5)     // Popularitas
```

## Integration Example

### Frontend Integration

```typescript
import { generateLearningPath, getRecommendations } from './services/adaptiveLearning';

// After assessment
const assessmentResults = await completeAssessment();

// Generate learning path
const learningPath = await generateLearningPath(
  studentId,
  assessmentResults
);

// Get recommended materials
const materials = await getRecommendations(studentId);

// Track activity completion
await trackProgress(studentId, activityId, {
  score: 0.85,
  accuracy: 0.9,
  timeSpent: 600
});
```

### Backend Integration with AI Engine

```javascript
// 1. Get assessment from AI engine
const assessment = await fetch('http://ai-engine:8000/api/assessment/analyze', {
  method: 'POST',
  body: JSON.stringify(assessmentData)
});

// 2. Generate learning path
const learningPath = await adaptiveLearningService.generateLearningPath(
  studentId,
  assessment.data
);

// 3. Send to frontend
return learningPath;
```

## Best Practices

### 1. Regular Assessment
- Asesmen awal (baseline)
- Asesmen berkala (setiap 2-3 minggu)
- Re-assessment setelah intervensi

### 2. Gradual Progression
- Increase difficulty hanya setelah konsisten berhasil
- Decrease difficulty jika struggling 3x berturut-turut
- Jangan skip terlalu banyak level

### 3. Personalization
- Pertimbangkan preferensi belajar
- Variasi jenis aktivitas
- Sesuaikan dengan konteks budaya

### 4. Monitoring
- Track progress real-time
- Alert untuk regression
- Celebrate milestones

### 5. Parent/Teacher Involvement
- Regular updates
- Action items yang jelas
- Collaboration tools

## Database Schema

```sql
-- Learning Paths
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  difficulty_level VARCHAR(20),
  duration INTEGER,
  sessions_per_week INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(20),
  focus_areas JSONB,
  created_at TIMESTAMP
);

-- Learning Modules
CREATE TABLE learning_modules (
  id UUID PRIMARY KEY,
  path_id UUID REFERENCES learning_paths(id),
  skill VARCHAR(50),
  order INTEGER,
  title VARCHAR(255),
  duration INTEGER,
  difficulty VARCHAR(20),
  objectives JSONB,
  activities JSONB,
  status VARCHAR(20)
);

-- Progress Tracking
CREATE TABLE progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  activity_id UUID,
  score DECIMAL,
  accuracy DECIMAL,
  time_spent INTEGER,
  completed_at TIMESTAMP,
  status VARCHAR(20),
  metrics JSONB
);

-- Interventions
CREATE TABLE interventions (
  id UUID PRIMARY KEY,
  path_id UUID REFERENCES learning_paths(id),
  type VARCHAR(50),
  title VARCHAR(255),
  frequency VARCHAR(20),
  scheduled_date TIMESTAMP,
  status VARCHAR(20),
  priority INTEGER
);
```

## Metrics & KPIs

### Student Level
- **Learning Velocity**: Kecepatan menyelesaikan modul
- **Skill Growth Rate**: Peningkatan skill per minggu
- **Engagement Score**: Tingkat keterlibatan
- **Completion Rate**: Persentase aktivitas selesai

### System Level
- **Adaptation Accuracy**: Seberapa akurat adjustment
- **Recommendation Relevance**: CTR material yang direkomendasikan
- **Intervention Effectiveness**: Success rate intervensi
- **Overall Learning Gains**: Peningkatan rata-rata siswa

## Troubleshooting

### Issue: Difficulty tidak adjust
- Check recent progress data (minimal 5 entries)
- Verify performance calculation
- Review adjustment thresholds

### Issue: Recommendations tidak relevant
- Check student's learning path exists
- Verify skill mappings
- Review material database quality

### Issue: Progress tidak tracked
- Verify activityId valid
- Check database connection
- Review performanceData format

## Future Enhancements

- [ ] Collaborative filtering untuk recommendations
- [ ] Predictive analytics untuk early intervention
- [ ] Gamification elements
- [ ] Multi-language support
- [ ] Parent mobile app
- [ ] AI-powered content generation

## License

Internal project - CORTEXIA Capstone UNIB

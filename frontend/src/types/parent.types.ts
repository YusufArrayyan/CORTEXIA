/**
 * Parent Dashboard Type Definitions
 * TypeScript types for parent-related data structures
 */

import { DifficultyLevel } from './teacher.types';

// Dashboard Summary
export interface ParentDashboardSummary {
  totalChildren: number;
  childrenWithActivePath: number;
  childrenNeedingAttention: number;
  recentFeedback: number;
  upcomingInterventions: number;
}

export interface ChildSummary {
  id: number;
  fullName: string;
  class: {
    id: number;
    name: string;
    grade: string;
    teacher: {
      user: {
        fullName: string;
        email: string;
      };
    };
  };
  currentStatus: DifficultyLevel;
  progress: number;
  lastAssessment: {
    id: number;
    overallDifficulty: DifficultyLevel;
    confidence: number;
    createdAt: string;
  } | null;
}

export interface ParentDashboardData {
  summary: ParentDashboardSummary;
  children: ChildSummary[];
}

// Child Details
export interface ChildDetails {
  id: number;
  userId: number;
  classId: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    username: string;
    createdAt: string;
  };
  class: {
    id: number;
    name: string;
    grade: string;
    teacher: {
      user: {
        id: number;
        fullName: string;
        email: string;
      };
    };
  };
  learningPaths: LearningPath[];
  assessments: Assessment[];
  feedback: TeacherFeedback[];
  analytics?: LearningAnalytics;
}

export interface LearningPath {
  id: number;
  studentId: number;
  difficultyLevel: DifficultyLevel;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  currentProgress: number;
  startDate: string;
  targetDate?: string;
  modules: LearningModule[];
}

export interface LearningModule {
  id: number;
  skillName: string;
  targetLevel: number;
  status: string;
  objectives: string[];
  activities: string[];
  interventions: Intervention[];
}

export interface Intervention {
  id: number;
  type: string;
  description: string;
  scheduledDate: string;
  duration?: number;
  status: string;
}

// Assessment Types
export interface Assessment {
  id: number;
  studentId: number;
  overallDifficulty: DifficultyLevel;
  confidence: number;
  recommendations: string[];
  createdAt: string;
  skillAssessments: SkillAssessment[];
  difficultWords: DifficultWord[];
}

export interface SkillAssessment {
  id: number;
  skillName: string;
  difficulty: DifficultyLevel;
  score: number;
  confidence: number;
  indicators: string[];
}

export interface DifficultWord {
  id: number;
  word: string;
  difficulty: number;
  issues: string[];
}

// Assessment Insights (Parent-Friendly)
export interface AssessmentInsights {
  assessmentDate: string;
  overallStatus: DifficultyLevel;
  confidence: number;
  skillBreakdown: SkillInsight[];
  challengingWords: {
    word: string;
    issues: string[];
  }[];
  recommendations: string[];
  homePracticeActivities: HomeActivity[];
}

export interface SkillInsight {
  skillName: string;
  level: DifficultyLevel;
  score: number;
  description: string;
  parentTips: string[];
}

export interface HomeActivity {
  title: string;
  description: string;
  frequency: string;
}

// Progress Tracking
export interface ChildProgress {
  period: number;
  assessmentCount: number;
  overallTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  skillProgress: SkillProgress[];
  timeline: TimelinePoint[];
  practiceSessions: PracticeSession[];
}

export interface SkillProgress {
  skillName: string;
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining';
  latestScore: number;
}

export interface TimelinePoint {
  date: string;
  difficulty: DifficultyLevel;
  confidence: number;
}

export interface PracticeSession {
  date: string;
  skill: string;
  performance: number;
  feedback: string;
}

// Home Practice
export interface HomePracticeRecommendations {
  daily: DailyActivity[];
  weekly: WeeklyGoal[];
  resources: ParentResource[];
  practiceWords: string[];
  tips: string[];
}

export interface DailyActivity {
  activity: string;
  duration: string;
  tips: string;
}

export interface WeeklyGoal {
  skill: string;
  goal: string;
  activities: string[];
}

export interface ParentResource {
  title: string;
  type: 'PDF' | 'Video' | 'List' | 'Article';
  url: string;
}

// Teacher Feedback
export interface TeacherFeedback {
  id: number;
  teacherId: number;
  studentId: number;
  type: 'PROGRESS' | 'CONCERN' | 'PRAISE' | 'RECOMMENDATION' | 'NOTE';
  content: string;
  isPrivate: boolean;
  relatedAssessmentId?: number;
  createdAt: string;
  teacher: {
    user: {
      fullName: string;
      email: string;
    };
  };
  relatedAssessment?: {
    id: number;
    createdAt: string;
    overallDifficulty: DifficultyLevel;
  };
}

// Learning Analytics
export interface LearningAnalytics {
  studentId: number;
  learningPathId: number;
  overallProgress: number;
  skillProgress: Record<string, {
    skillName: string;
    currentLevel: number;
    targetLevel: number;
    progress: number;
    trend: 'improving' | 'stable' | 'declining';
    recentScores: number[];
  }>;
  progressTrend: 'improving' | 'stable' | 'declining';
  estimatedCompletion?: string;
  strengths: string[];
  weaknesses: string[];
  milestones: Milestone[];
}

export interface Milestone {
  date: string;
  description: string;
  skillName?: string;
  achieved: boolean;
}

// Milestones & Achievements
export interface MilestonesData {
  milestones: Milestone[];
  achievements: Achievement[];
}

export interface Achievement {
  title: string;
  icon: string;
  description?: string;
  date?: Date;
}

// Helper Types
export interface ChildProgressQuery {
  period?: number; // days, default 90
}

// Chart Data
export interface ProgressChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

export interface SkillChartData {
  skillName: string;
  current: number;
  target: number;
  progress: number;
}

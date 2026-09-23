/**
 * Teacher Dashboard Type Definitions
 * Complete TypeScript types for teacher-related data structures
 */

export enum DifficultyLevel {
  NONE = 'NONE',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE'
}

export enum InterventionType {
  TARGETED_PRACTICE = 'TARGETED_PRACTICE',
  GUIDED_READING = 'GUIDED_READING',
  PEER_TUTORING = 'PEER_TUTORING',
  ASSISTIVE_TECHNOLOGY = 'ASSISTIVE_TECHNOLOGY',
  SMALL_GROUP = 'SMALL_GROUP',
  ONE_ON_ONE = 'ONE_ON_ONE',
  PARENT_INVOLVEMENT = 'PARENT_INVOLVEMENT',
  SPECIALIST_REFERRAL = 'SPECIALIST_REFERRAL'
}

export enum InterventionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum FeedbackType {
  PROGRESS = 'PROGRESS',
  CONCERN = 'CONCERN',
  PRAISE = 'PRAISE',
  RECOMMENDATION = 'RECOMMENDATION',
  NOTE = 'NOTE'
}

export enum LearningPathStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

// Dashboard Summary
export interface DashboardSummary {
  totalClasses: number;
  totalStudents: number;
  recentAssessments: number;
  studentsNeedingIntervention: number;
  pendingInterventions: number;
}

export interface DifficultyDistribution {
  NONE?: number;
  MILD?: number;
  MODERATE?: number;
  SEVERE?: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  classes: ClassSummary[];
  difficultyDistribution: DifficultyDistribution;
}

// Class Types
export interface ClassSummary {
  id: number;
  name: string;
  grade: string;
  studentCount: number;
}

export interface ClassDetails {
  id: number;
  name: string;
  grade: string;
  academicYear: string;
  description?: string;
  students: StudentInClass[];
  teacher: {
    user: {
      fullName: string;
      email: string;
    };
  };
}

export interface StudentInClass {
  id: number;
  userId: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    createdAt: string;
  };
  learningPaths: LearningPathSummary[];
  assessments: AssessmentSummary[];
}

// Student Types
export interface StudentDetails {
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
  };
  learningPaths: LearningPath[];
  assessments: Assessment[];
  analytics?: LearningAnalytics;
}

// Learning Path Types
export interface LearningPathSummary {
  id: number;
  difficultyLevel: DifficultyLevel;
  currentProgress: number;
  startDate?: string;
  targetDate?: string;
}

export interface LearningPath {
  id: number;
  studentId: number;
  difficultyLevel: DifficultyLevel;
  status: LearningPathStatus;
  currentProgress: number;
  startDate: string;
  targetDate?: string;
  completedAt?: string;
  notes?: string;
  modules: LearningModule[];
}

export interface LearningModule {
  id: number;
  learningPathId: number;
  skillName: string;
  targetLevel: number;
  status: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  estimatedDuration: number;
  currentScore?: number;
  interventions: Intervention[];
}

// Intervention Types
export interface Intervention {
  id: number;
  learningModuleId: number;
  type: InterventionType;
  description: string;
  scheduledDate: string;
  duration?: number;
  status: InterventionStatus;
  completedAt?: string;
  completionNotes?: string;
  effectiveness?: number;
  notes?: string;
}

export interface CreateInterventionRequest {
  learningModuleId: number;
  type: InterventionType;
  description: string;
  scheduledDate: string;
  duration?: number;
  notes?: string;
}

export interface UpdateInterventionRequest {
  status: InterventionStatus;
  completionNotes?: string;
  effectiveness?: number;
}

// Assessment Types
export interface AssessmentSummary {
  id: number;
  overallDifficulty: DifficultyLevel;
  createdAt: string;
}

export interface Assessment {
  id: number;
  studentId: number;
  sessionId: string;
  overallDifficulty: DifficultyLevel;
  confidence: number;
  recommendations: string[];
  immediateInterventions: string[];
  longTermRecommendations: string[];
  createdAt: string;
  student?: {
    id: number;
    fullName: string;
    email: string;
  };
  skillAssessments: SkillAssessment[];
  difficultWords: DifficultWord[];
  gazeData?: GazeDataSummary;
  speechData?: SpeechDataSummary;
}

export interface SkillAssessment {
  id: number;
  assessmentId: number;
  skillName: string;
  difficulty: DifficultyLevel;
  score: number;
  confidence: number;
  indicators: string[];
}

export interface DifficultWord {
  id: number;
  assessmentId: number;
  word: string;
  difficulty: number;
  issues: string[];
}

export interface GazeDataSummary {
  id: number;
  assessmentId: number;
  readingSpeed: number;
  fixationDuration: number;
  regressionRate: number;
  skipRate: number;
  gazePoints: GazePoint[];
  fixations: Fixation[];
}

export interface GazePoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface Fixation {
  id: number;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  wordIndex?: number;
}

export interface SpeechDataSummary {
  id: number;
  assessmentId: number;
  accuracy: number;
  wordsPerMinute: number;
  correctWordsPerMinute: number;
  fluencyScore: number;
  pronunciationAssessments: PronunciationAssessment[];
}

export interface PronunciationAssessment {
  id: number;
  word: string;
  recognized: string;
  accuracy: number;
  errorType?: string;
}

// Analytics Types
export interface LearningAnalytics {
  studentId: number;
  learningPathId: number;
  overallProgress: number;
  skillProgress: Record<string, SkillProgress>;
  progressTrend: 'improving' | 'stable' | 'declining';
  estimatedCompletion?: string;
  strengths: string[];
  weaknesses: string[];
  milestones: Milestone[];
}

export interface SkillProgress {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  trend: 'improving' | 'stable' | 'declining';
  recentScores: number[];
}

export interface Milestone {
  date: string;
  description: string;
  skillName?: string;
  achieved: boolean;
}

// Class Analytics Types
export interface ClassAnalytics {
  period: number;
  studentCount: number;
  assessmentCount: number;
  difficultyDistribution: DifficultyDistribution;
  skillAverages: Record<string, {
    score: number;
    confidence: number;
  }>;
  activePaths: DifficultyDistribution;
  interventionStats: InterventionStats[];
  averagePerformance: number;
}

export interface InterventionStats {
  status: InterventionStatus;
  type: InterventionType;
  count: number;
}

// Material Assignment Types
export interface MaterialAssignment {
  id: number;
  studentId: number;
  materialId: number;
  assignedById: number;
  dueDate?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  notes?: string;
  material: ReadingMaterial;
  student: {
    fullName: string;
  };
}

export interface ReadingMaterial {
  id: number;
  title: string;
  content: string;
  difficultyLevel: DifficultyLevel;
  grade: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface AssignMaterialRequest {
  studentId: number;
  materialId: number;
  dueDate?: string;
  notes?: string;
}

// Feedback Types
export interface TeacherFeedback {
  id: number;
  teacherId: number;
  studentId: number;
  type: FeedbackType;
  content: string;
  isPrivate: boolean;
  relatedAssessmentId?: number;
  createdAt: string;
  teacher: {
    user: {
      fullName: string;
    };
  };
}

export interface CreateFeedbackRequest {
  studentId: number;
  type: FeedbackType;
  content: string;
  isPrivate: boolean;
  relatedAssessmentId?: number;
}

// Report Types
export interface ClassReport {
  class: {
    name: string;
    grade: string;
    academicYear: string;
  };
  generatedAt: string;
  summary: {
    totalStudents: number;
    withActivePath: number;
    needingIntervention: number;
  };
  students: StudentReportData[];
}

export interface StudentReportData {
  name: string;
  email: string;
  currentDifficulty: DifficultyLevel;
  progress: number;
  recentAssessments: number;
  lastAssessmentDate?: string;
  skillScores?: Record<string, number>;
}

// Update Request Types
export interface UpdateLearningPathRequest {
  difficultyLevel?: DifficultyLevel;
  status?: LearningPathStatus;
  targetDate?: string;
  notes?: string;
}

// Filter & Sort Types
export interface StudentFilter {
  difficultyLevel?: DifficultyLevel;
  minProgress?: number;
  maxProgress?: number;
  needsIntervention?: boolean;
}

export interface StudentSort {
  field: 'name' | 'difficulty' | 'progress' | 'lastAssessment';
  order: 'asc' | 'desc';
}

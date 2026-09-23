/**
 * Speech Analysis Types
 * 
 * Type definitions for speech recognition, pronunciation analysis,
 * and reading fluency assessment.
 */

/**
 * Speech Recognition Result
 */
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
  alternatives?: string[];
}

/**
 * Word Recognition Result
 * Individual word from speech recognition
 */
export interface WordRecognitionResult {
  word: string;
  confidence: number;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Pronunciation Assessment
 * Evaluation of how well a word was pronounced
 */
export interface PronunciationAssessment {
  word: string;
  expectedWord: string;
  accuracy: number; // 0-1 score
  isCorrect: boolean;
  isMispronounced: boolean;
  isOmitted: boolean;
  isInserted: boolean;
  phonemeErrors?: PhonemeError[];
}

/**
 * Phoneme Error
 * Specific phonetic error in pronunciation
 */
export interface PhonemeError {
  expected: string;
  actual: string;
  position: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Prosody Analysis
 * Analysis of speech rhythm, intonation, and fluency
 */
export interface ProsodyAnalysis {
  speakingRate: number; // Words per minute
  pauseCount: number;
  averagePauseDuration: number; // milliseconds
  longestPauseDuration: number;
  pitchVariation: number; // 0-1 score
  volumeVariation: number; // 0-1 score
  fluencyScore: number; // 0-1 score
  monotoneIndicator: number; // 0-1 score (higher = more monotone)
}

/**
 * Reading Fluency Metrics
 * Overall reading performance based on speech
 */
export interface ReadingFluencyMetrics {
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  omittedWords: number;
  insertedWords: number;
  substitutedWords: number;
  accuracy: number; // 0-1 score
  wordsPerMinute: number;
  correctWordsPerMinute: number;
  prosody: ProsodyAnalysis;
  hesitationCount: number;
  repetitionCount: number;
  selfCorrectionCount: number;
  overallFluencyScore: number; // 0-1 score
}

/**
 * Speech Session Data
 * Complete speech analysis session data for backend
 */
export interface SpeechSessionData {
  sessionId: string;
  userId: string;
  studentId: string;
  assessmentId?: string;
  materialId?: string;
  startTime: number;
  endTime?: number;
  expectedText: string;
  recognitionResults: SpeechRecognitionResult[];
  wordResults: WordRecognitionResult[];
  pronunciationAssessments: PronunciationAssessment[];
  fluencyMetrics: ReadingFluencyMetrics;
  audioBlob?: Blob;
  metadata?: Record<string, any>;
}

/**
 * Speech Recognition Config
 */
export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

/**
 * Hesitation Detection
 */
export interface Hesitation {
  type: 'pause' | 'filler' | 'repetition';
  timestamp: number;
  duration?: number;
  word?: string;
  context?: string;
}

/**
 * Reading Error
 */
export interface ReadingError {
  type: 'mispronunciation' | 'omission' | 'insertion' | 'substitution';
  position: number;
  expectedWord: string;
  actualWord?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Audio Features
 * Extracted audio features for analysis
 */
export interface AudioFeatures {
  pitch: number[]; // Hz
  volume: number[]; // dB
  energy: number[];
  tempo: number;
  spectralCentroid: number[];
  zeroCrossingRate: number[];
}

/**
 * Word Alignment
 * Alignment between expected text and recognized speech
 */
export interface WordAlignment {
  expectedWord: string;
  recognizedWord?: string;
  alignmentType: 'match' | 'substitution' | 'insertion' | 'deletion';
  confidence: number;
  timestamp: number;
}

/**
 * Speech Event
 */
export type SpeechEvent = 
  | { type: 'start'; timestamp: number }
  | { type: 'end'; timestamp: number }
  | { type: 'result'; result: SpeechRecognitionResult }
  | { type: 'error'; error: string; timestamp: number }
  | { type: 'pause'; duration: number; timestamp: number }
  | { type: 'resume'; timestamp: number };

/**
 * Speech Recognition State
 */
export interface SpeechRecognitionState {
  isInitialized: boolean;
  isListening: boolean;
  isPaused: boolean;
  currentTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
}

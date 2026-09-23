/**
 * Gaze tracking types for CORTEXIA
 */

// Calibration point coordinates
export interface CalibrationPoint {
  x: number;
  y: number;
  index: number;
}

// Gaze data point from WebGazer
export interface GazeData {
  x: number;
  y: number;
  timestamp: number;
}

// Processed gaze data with fixation information
export interface ProcessedGazeData {
  x: number;
  y: number;
  timestamp: number;
  fixationDuration?: number;
  wordIndex?: number;
  isRegression?: boolean;
  saccadeLength?: number;
}

// Calibration state
export interface CalibrationState {
  isCalibrating: boolean;
  currentPoint: number;
  totalPoints: number;
  points: CalibrationPoint[];
  accuracy: number;
  isComplete: boolean;
}

// Gaze tracking configuration
export interface GazeConfig {
  samplingRate: number; // milliseconds
  saveDataInterval: number; // milliseconds
  calibrationPoints: number;
  minCalibrationAccuracy: number; // percentage
  videoConstraints: MediaStreamConstraints;
}

// Fixation event
export interface FixationEvent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  timestamp: number;
  wordIndex?: number;
}

// Saccade event (rapid eye movement)
export interface SaccadeEvent {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  timestamp: number;
  isRegression: boolean; // backward movement
}

// Gaze tracking session
export interface GazeSession {
  sessionId: string;
  calibrationId: string;
  startTime: number;
  endTime?: number;
  gazeData: ProcessedGazeData[];
  fixations: FixationEvent[];
  saccades: SaccadeEvent[];
  isActive: boolean;
}

// Heatmap data for visualization
export interface HeatmapData {
  x: number;
  y: number;
  value: number; // intensity
}

// Gaze analysis results
export interface GazeAnalysis {
  avgFixationDuration: number;
  totalFixations: number;
  totalSaccades: number;
  regressionCount: number;
  readingSpeed: number; // words per minute
  focusScore: number; // 0-100
  difficultyAreas: {
    wordIndex: number;
    difficulty: number;
  }[];
  heatmapData: HeatmapData[];
}

// WebGazer types
export interface WebGazerInstance {
  setGazeListener: (callback: (data: GazeData | null, timestamp: number) => void) => WebGazerInstance;
  showVideo: (show: boolean) => WebGazerInstance;
  showPredictionPoints: (show: boolean) => WebGazerInstance;
  showFaceOverlay: (show: boolean) => WebGazerInstance;
  showFaceFeedbackBox: (show: boolean) => WebGazerInstance;
  saveDataAcrossSessions: (save: boolean) => WebGazerInstance;
  begin: () => Promise<void>;
  end: () => WebGazerInstance;
  pause: () => WebGazerInstance;
  resume: () => WebGazerInstance;
  getCurrentPrediction: () => GazeData | null;
  getVideoPreviewToCameraResolutionRatio: () => number;
  params: {
    imgWidth: number;
    imgHeight: number;
    moveTickSize: number;
  };
  clearData: () => void;
  applyKalmanFilter: (enable: boolean) => WebGazerInstance;
}

// Word position for reading analysis
export interface WordPosition {
  word: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  element: HTMLElement;
}

// Reading material with word positions
export interface ReadingMaterial {
  id: string;
  content: string;
  words: WordPosition[];
  totalWords: number;
}

// Calibration validation result
export interface CalibrationValidation {
  isValid: boolean;
  accuracy: number;
  message: string;
  requiresRecalibration: boolean;
}

export default GazeData;

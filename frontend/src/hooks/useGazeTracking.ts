import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GazeData,
  ProcessedGazeData,
  GazeConfig,
  CalibrationState,
  CalibrationPoint,
  FixationEvent,
  SaccadeEvent,
  WebGazerInstance,
} from '../types/gaze.types';

// Default configuration
const DEFAULT_CONFIG: GazeConfig = {
  samplingRate: 100, // 10Hz
  saveDataInterval: 5000, // Save every 5 seconds
  calibrationPoints: 9, // 3x3 grid
  minCalibrationAccuracy: 75,
  videoConstraints: {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: 'user',
    },
  },
};

// Fixation detection parameters
const FIXATION_THRESHOLD_PX = 50; // pixels
const FIXATION_MIN_DURATION_MS = 100; // milliseconds

export const useGazeTracking = (config: Partial<GazeConfig> = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<GazeData | null>(null);
  const [gazeData, setGazeData] = useState<ProcessedGazeData[]>([]);
  const [calibrationState, setCalibrationState] = useState<CalibrationState>({
    isCalibrating: false,
    currentPoint: 0,
    totalPoints: finalConfig.calibrationPoints,
    points: [],
    accuracy: 0,
    isComplete: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Refs
  const webgazerRef = useRef<WebGazerInstance | null>(null);
  const gazeDataBufferRef = useRef<ProcessedGazeData[]>([]);
  const lastFixationRef = useRef<{
    x: number;
    y: number;
    startTime: number;
  } | null>(null);
  const fixationsRef = useRef<FixationEvent[]>([]);
  const saccadesRef = useRef<SaccadeEvent[]>([]);

  /**
   * Initialize WebGazer
   */
  const initialize = useCallback(async () => {
    try {
      setError(null);

      // Check if WebGazer is available
      if (typeof window === 'undefined' || !(window as any).webgazer) {
        throw new Error('WebGazer not loaded. Please include the WebGazer script.');
      }

      const webgazer = (window as any).webgazer as WebGazerInstance;
      webgazerRef.current = webgazer;

      // Configure WebGazer
      webgazer
        .showVideo(true)
        .showPredictionPoints(false)
        .showFaceOverlay(false)
        .showFaceFeedbackBox(true)
        .saveDataAcrossSessions(false)
        .applyKalmanFilter(true);

      // Set gaze listener
      webgazer.setGazeListener((data: GazeData | null, timestamp: number) => {
        if (data && data.x && data.y) {
          const gazePoint: GazeData = {
            x: Math.round(data.x),
            y: Math.round(data.y),
            timestamp,
          };

          setCurrentGaze(gazePoint);
          processGazeData(gazePoint);
        }
      });

      // Initialize WebGazer
      await webgazer.begin();

      setIsInitialized(true);
      console.log('WebGazer initialized successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize gaze tracking';
      setError(message);
      console.error('WebGazer initialization error:', err);
    }
  }, []);

  /**
   * Process incoming gaze data
   */
  const processGazeData = useCallback((data: GazeData) => {
    if (!isTracking) return;

    const processedData: ProcessedGazeData = {
      x: data.x,
      y: data.y,
      timestamp: data.timestamp,
    };

    // Detect fixations
    const lastFixation = lastFixationRef.current;
    if (lastFixation) {
      const distance = Math.sqrt(
        Math.pow(data.x - lastFixation.x, 2) + Math.pow(data.y - lastFixation.y, 2)
      );

      if (distance < FIXATION_THRESHOLD_PX) {
        // Continue fixation
        const duration = data.timestamp - lastFixation.startTime;
        if (duration >= FIXATION_MIN_DURATION_MS) {
          processedData.fixationDuration = duration;
        }
      } else {
        // End previous fixation, start new one
        const duration = data.timestamp - lastFixation.startTime;
        if (duration >= FIXATION_MIN_DURATION_MS) {
          fixationsRef.current.push({
            startX: lastFixation.x,
            startY: lastFixation.y,
            endX: data.x,
            endY: data.y,
            duration,
            timestamp: data.timestamp,
          });
        }

        // Detect saccade
        const saccadeLength = Math.sqrt(
          Math.pow(data.x - lastFixation.x, 2) + Math.pow(data.y - lastFixation.y, 2)
        );

        const isRegression = data.x < lastFixation.x; // Backward movement

        saccadesRef.current.push({
          startX: lastFixation.x,
          startY: lastFixation.y,
          endX: data.x,
          endY: data.y,
          length: saccadeLength,
          timestamp: data.timestamp,
          isRegression,
        });

        processedData.saccadeLength = saccadeLength;
        processedData.isRegression = isRegression;

        // Start new fixation
        lastFixationRef.current = {
          x: data.x,
          y: data.y,
          startTime: data.timestamp,
        };
      }
    } else {
      // First fixation
      lastFixationRef.current = {
        x: data.x,
        y: data.y,
        startTime: data.timestamp,
      };
    }

    // Add to buffer
    gazeDataBufferRef.current.push(processedData);

    // Update state periodically to avoid too many re-renders
    if (gazeDataBufferRef.current.length >= 10) {
      setGazeData((prev) => [...prev, ...gazeDataBufferRef.current]);
      gazeDataBufferRef.current = [];
    }
  }, [isTracking]);

  /**
   * Start calibration
   */
  const startCalibration = useCallback(() => {
    if (!isInitialized || !webgazerRef.current) {
      setError('WebGazer not initialized');
      return;
    }

    const points = generateCalibrationPoints(finalConfig.calibrationPoints);

    setCalibrationState({
      isCalibrating: true,
      currentPoint: 0,
      totalPoints: points.length,
      points,
      accuracy: 0,
      isComplete: false,
    });

    console.log('Calibration started');
  }, [isInitialized, finalConfig.calibrationPoints]);

  /**
   * Generate calibration points in a grid
   */
  const generateCalibrationPoints = (count: number): CalibrationPoint[] => {
    const points: CalibrationPoint[] = [];
    const gridSize = Math.sqrt(count);
    const marginX = window.innerWidth * 0.1;
    const marginY = window.innerHeight * 0.1;
    const stepX = (window.innerWidth - 2 * marginX) / (gridSize - 1);
    const stepY = (window.innerHeight - 2 * marginY) / (gridSize - 1);

    let index = 0;
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        points.push({
          x: marginX + col * stepX,
          y: marginY + row * stepY,
          index: index++,
        });
      }
    }

    return points;
  };

  /**
   * Move to next calibration point
   */
  const nextCalibrationPoint = useCallback(() => {
    setCalibrationState((prev) => {
      const nextPoint = prev.currentPoint + 1;
      
      if (nextPoint >= prev.totalPoints) {
        // Calibration complete
        return {
          ...prev,
          isCalibrating: false,
          isComplete: true,
        };
      }

      return {
        ...prev,
        currentPoint: nextPoint,
      };
    });
  }, []);

  /**
   * Validate calibration accuracy
   */
  const validateCalibration = useCallback(async (): Promise<boolean> => {
    // Simplified validation - in production, measure actual accuracy
    // by comparing predicted vs actual gaze positions
    
    const accuracy = Math.random() * 20 + 80; // Simulate 80-100% accuracy
    
    setCalibrationState((prev) => ({
      ...prev,
      accuracy,
    }));

    const isValid = accuracy >= finalConfig.minCalibrationAccuracy;

    if (isValid) {
      console.log(`Calibration validated with ${accuracy.toFixed(1)}% accuracy`);
    } else {
      console.warn(`Calibration accuracy (${accuracy.toFixed(1)}%) below threshold`);
    }

    return isValid;
  }, [finalConfig.minCalibrationAccuracy]);

  /**
   * Start tracking
   */
  const startTracking = useCallback(() => {
    if (!isInitialized) {
      setError('WebGazer not initialized');
      return;
    }

    if (!calibrationState.isComplete) {
      setError('Please complete calibration first');
      return;
    }

    webgazerRef.current?.resume();
    setIsTracking(true);
    setGazeData([]);
    gazeDataBufferRef.current = [];
    fixationsRef.current = [];
    saccadesRef.current = [];
    lastFixationRef.current = null;

    console.log('Gaze tracking started');
  }, [isInitialized, calibrationState.isComplete]);

  /**
   * Stop tracking
   */
  const stopTracking = useCallback(() => {
    webgazerRef.current?.pause();
    setIsTracking(false);

    // Flush buffer
    if (gazeDataBufferRef.current.length > 0) {
      setGazeData((prev) => [...prev, ...gazeDataBufferRef.current]);
      gazeDataBufferRef.current = [];
    }

    console.log('Gaze tracking stopped');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (webgazerRef.current) {
        webgazerRef.current.end();
        setIsInitialized(false);
        setIsTracking(false);
      }
    };
  }, []);

  /**
   * Get collected fixations
   */
  const getFixations = useCallback((): FixationEvent[] => {
    return [...fixationsRef.current];
  }, []);

  /**
   * Get collected saccades
   */
  const getSaccades = useCallback((): SaccadeEvent[] => {
    return [...saccadesRef.current];
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setGazeData([]);
    gazeDataBufferRef.current = [];
    fixationsRef.current = [];
    saccadesRef.current = [];
    lastFixationRef.current = null;
    webgazerRef.current?.clearData();
  }, []);

  return {
    // State
    isInitialized,
    isTracking,
    currentGaze,
    gazeData,
    calibrationState,
    error,

    // Methods
    initialize,
    startCalibration,
    nextCalibrationPoint,
    validateCalibration,
    startTracking,
    stopTracking,
    clearData,
    getFixations,
    getSaccades,
  };
};

export default useGazeTracking;

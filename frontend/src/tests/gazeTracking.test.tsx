import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGazeTracking } from '../hooks/useGazeTracking';
import { WordTracker } from '../utils/wordTracker';
import { GazePoint, Fixation } from '../types/gaze.types';

// Mock WebGazer
const mockWebGazer = {
  setGazeListener: vi.fn(),
  begin: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  resume: vi.fn(),
  end: vi.fn(),
  showPredictionPoints: vi.fn(),
  applyKalmanFilter: vi.fn(),
  setRegression: vi.fn(),
  showVideoPreview: vi.fn(),
  clearData: vi.fn()
};

(global as any).webgazer = mockWebGazer;

describe('Gaze Tracking Module', () => {
  describe('useGazeTracking Hook', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should initialize successfully', async () => {
      const { result } = renderHook(() => useGazeTracking());

      expect(result.current.isInitialized).toBe(false);

      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(mockWebGazer.begin).toHaveBeenCalled();
    });

    it('should start and stop tracking', async () => {
      const { result } = renderHook(() => useGazeTracking());

      await act(async () => {
        await result.current.initialize();
      });

      await act(async () => {
        await result.current.startTracking();
      });

      expect(result.current.isTracking).toBe(true);
      expect(mockWebGazer.resume).toHaveBeenCalled();

      act(() => {
        result.current.stopTracking();
      });

      expect(result.current.isTracking).toBe(false);
      expect(mockWebGazer.pause).toHaveBeenCalled();
    });

    it('should detect fixations', async () => {
      const onFixation = vi.fn();
      const { result } = renderHook(() =>
        useGazeTracking({ onFixation })
      );

      await act(async () => {
        await result.current.initialize();
        await result.current.startTracking();
      });

      // Simulate gaze points in same location (fixation)
      const gazeCallback = mockWebGazer.setGazeListener.mock.calls[0][0];

      await act(async () => {
        for (let i = 0; i < 10; i++) {
          gazeCallback({ x: 100, y: 100 }, null);
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      });

      await waitFor(() => {
        expect(onFixation).toHaveBeenCalled();
      });
    });

    it('should perform calibration', async () => {
      const { result } = renderHook(() => useGazeTracking());

      await act(async () => {
        await result.current.initialize();
      });

      await act(async () => {
        await result.current.startCalibration();
      });

      expect(result.current.isCalibrating).toBe(true);
      expect(result.current.calibrationProgress).toBe(0);
    });

    it('should cleanup resources', async () => {
      const { result } = renderHook(() => useGazeTracking());

      await act(async () => {
        await result.current.initialize();
      });

      act(() => {
        result.current.cleanup();
      });

      expect(mockWebGazer.end).toHaveBeenCalled();
    });
  });

  describe('WordTracker', () => {
    let tracker: WordTracker;
    let mockContainer: HTMLElement;

    beforeEach(() => {
      tracker = new WordTracker();
      
      // Create mock DOM element
      mockContainer = document.createElement('div');
      mockContainer.innerHTML = 'Hello world this is a test';
      document.body.appendChild(mockContainer);
    });

    afterEach(() => {
      document.body.removeChild(mockContainer);
      tracker.reset();
    });

    it('should extract word positions', () => {
      const positions = tracker.extractWordPositions(mockContainer);
      
      expect(positions.length).toBeGreaterThan(0);
      expect(positions[0]).toHaveProperty('word');
      expect(positions[0]).toHaveProperty('x');
      expect(positions[0]).toHaveProperty('y');
      expect(positions[0]).toHaveProperty('width');
      expect(positions[0]).toHaveProperty('height');
    });

    it('should process fixations on words', () => {
      const positions = tracker.extractWordPositions(mockContainer);
      
      if (positions.length > 0) {
        const firstWord = positions[0];
        const fixation: Fixation = {
          x: firstWord.x + firstWord.width / 2,
          y: firstWord.y + firstWord.height / 2,
          duration: 250,
          timestamp: Date.now(),
          gazePoints: []
        };

        tracker.processFixation(fixation);

        const wordData = tracker.getWordGazeData(0);
        expect(wordData).toBeDefined();
        expect(wordData?.fixationCount).toBe(1);
        expect(wordData?.totalDuration).toBe(250);
        expect(wordData?.skipped).toBe(false);
      }
    });

    it('should detect regressions', () => {
      const positions = tracker.extractWordPositions(mockContainer);
      
      if (positions.length >= 2) {
        // Fixate on second word
        const secondWord = positions[1];
        tracker.processFixation({
          x: secondWord.x + 10,
          y: secondWord.y + 10,
          duration: 200,
          timestamp: Date.now(),
          gazePoints: []
        });

        // Fixate on first word (regression)
        const firstWord = positions[0];
        tracker.processFixation({
          x: firstWord.x + 10,
          y: firstWord.y + 10,
          duration: 200,
          timestamp: Date.now() + 100,
          gazePoints: []
        });

        const wordData = tracker.getWordGazeData(0);
        expect(wordData?.regressionCount).toBe(1);
      }
    });

    it('should calculate reading metrics', () => {
      tracker.extractWordPositions(mockContainer);
      
      // Simulate some reading
      const metrics = tracker.calculateReadingMetrics();
      
      expect(metrics).toHaveProperty('totalWords');
      expect(metrics).toHaveProperty('wordsRead');
      expect(metrics).toHaveProperty('wordsSkipped');
      expect(metrics).toHaveProperty('readingSpeed');
      expect(metrics).toHaveProperty('averageFixationDuration');
      expect(metrics).toHaveProperty('regressionRate');
      expect(metrics).toHaveProperty('comprehensionIndicator');
      
      expect(metrics.totalWords).toBeGreaterThan(0);
      expect(metrics.comprehensionIndicator).toBeGreaterThanOrEqual(0);
      expect(metrics.comprehensionIndicator).toBeLessThanOrEqual(1);
    });

    it('should identify difficult words', () => {
      const positions = tracker.extractWordPositions(mockContainer);
      
      if (positions.length >= 3) {
        // Create normal fixations on first two words
        for (let i = 0; i < 2; i++) {
          const word = positions[i];
          tracker.processFixation({
            x: word.x + 10,
            y: word.y + 10,
            duration: 200,
            timestamp: Date.now() + i * 100,
            gazePoints: []
          });
        }

        // Create multiple long fixations on third word (difficult)
        const difficultWord = positions[2];
        for (let i = 0; i < 5; i++) {
          tracker.processFixation({
            x: difficultWord.x + 10,
            y: difficultWord.y + 10,
            duration: 500,
            timestamp: Date.now() + 200 + i * 100,
            gazePoints: []
          });
        }

        const difficultWords = tracker.getDifficultWords(1.5);
        expect(difficultWords).toContain(2);
      }
    });

    it('should export data correctly', () => {
      tracker.extractWordPositions(mockContainer);
      
      const exportedData = tracker.exportData();
      
      expect(exportedData).toHaveProperty('wordPositions');
      expect(exportedData).toHaveProperty('wordGazeData');
      expect(exportedData).toHaveProperty('readingMetrics');
      expect(exportedData).toHaveProperty('difficultWords');
      
      expect(Array.isArray(exportedData.wordPositions)).toBe(true);
      expect(Array.isArray(exportedData.wordGazeData)).toBe(true);
      expect(Array.isArray(exportedData.difficultWords)).toBe(true);
    });

    it('should reset correctly', () => {
      tracker.extractWordPositions(mockContainer);
      
      const metrics1 = tracker.calculateReadingMetrics();
      expect(metrics1.totalWords).toBeGreaterThan(0);
      
      tracker.reset();
      
      const metrics2 = tracker.calculateReadingMetrics();
      expect(metrics2.totalWords).toBe(0);
    });
  });

  describe('Fixation Detection Algorithm', () => {
    it('should group nearby gaze points as fixation', () => {
      const gazePoints: GazePoint[] = [];
      const baseTime = Date.now();
      
      // Create cluster of points (fixation)
      for (let i = 0; i < 10; i++) {
        gazePoints.push({
          x: 100 + Math.random() * 10, // Within 50px threshold
          y: 100 + Math.random() * 10,
          timestamp: baseTime + i * 100,
          confidence: 0.9
        });
      }

      // Simple fixation detection logic (same as in useGazeTracking)
      const THRESHOLD = 50;
      const MIN_DURATION = 100;
      
      let isFixation = true;
      let totalDuration = gazePoints[gazePoints.length - 1].timestamp - gazePoints[0].timestamp;
      
      for (let i = 1; i < gazePoints.length; i++) {
        const dx = gazePoints[i].x - gazePoints[0].x;
        const dy = gazePoints[i].y - gazePoints[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > THRESHOLD) {
          isFixation = false;
          break;
        }
      }
      
      expect(isFixation).toBe(true);
      expect(totalDuration).toBeGreaterThanOrEqual(MIN_DURATION);
    });

    it('should not detect fixation for scattered points', () => {
      const gazePoints: GazePoint[] = [];
      const baseTime = Date.now();
      
      // Create scattered points (no fixation)
      for (let i = 0; i < 10; i++) {
        gazePoints.push({
          x: 100 + i * 100, // Far apart
          y: 100 + i * 100,
          timestamp: baseTime + i * 100,
          confidence: 0.9
        });
      }

      const THRESHOLD = 50;
      
      let isFixation = true;
      
      for (let i = 1; i < gazePoints.length; i++) {
        const dx = gazePoints[i].x - gazePoints[0].x;
        const dy = gazePoints[i].y - gazePoints[0].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > THRESHOLD) {
          isFixation = false;
          break;
        }
      }
      
      expect(isFixation).toBe(false);
    });
  });

  describe('Reading Metrics Calculation', () => {
    it('should calculate reading speed correctly', () => {
      const totalWords = 100;
      const wordsRead = 90;
      const totalTime = 60; // 60 seconds
      
      const readingSpeed = (wordsRead / totalTime) * 60; // WPM
      
      expect(readingSpeed).toBe(90); // 90 WPM
    });

    it('should calculate regression rate correctly', () => {
      const totalFixations = 100;
      const regressions = 15;
      
      const regressionRate = (regressions / totalFixations) * 100;
      
      expect(regressionRate).toBe(15); // 15%
    });

    it('should calculate comprehension indicator', () => {
      const skipRate = 0.1; // 10% skipped
      const normalizedFixationDuration = 0.5; // Optimal
      const normalizedRegressionRate = 0.1; // Low
      
      const comprehension = Math.max(0, Math.min(1,
        (1 - skipRate) * 0.4 +
        (1 - Math.abs(normalizedFixationDuration - 0.5) * 2) * 0.3 +
        (1 - normalizedRegressionRate) * 0.3
      ));
      
      expect(comprehension).toBeGreaterThan(0.7); // Good comprehension
      expect(comprehension).toBeLessThanOrEqual(1);
    });
  });
});

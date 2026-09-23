import webgazer from 'webgazer';

export interface GazeData {
  timestamp: number;
  x: number;
  y: number;
}

export interface CalibrationPoint {
  x: number;
  y: number;
}

class GazeTrackingService {
  private gazeData: GazeData[] = [];
  private isTracking: boolean = false;
  private calibrationPoints: CalibrationPoint[] = [
    { x: 10, y: 10 },   // Top-left
    { x: 90, y: 10 },   // Top-right
    { x: 50, y: 50 },   // Center
    { x: 10, y: 90 },   // Bottom-left
    { x: 90, y: 90 },   // Bottom-right
  ];

  /**
   * Initialize WebGazer
   */
  async initialize(): Promise<void> {
    try {
      await webgazer
        .setGazeListener((data: any) => {
          if (data && this.isTracking) {
            this.gazeData.push({
              timestamp: Date.now(),
              x: data.x,
              y: data.y,
            });
          }
        })
        .begin();

      // Hide the prediction point by default
      webgazer.showPredictionPoints(false);
      
      console.log('WebGazer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebGazer:', error);
      throw new Error('Could not access camera for gaze tracking');
    }
  }

  /**
   * Show calibration interface
   */
  showCalibration(): CalibrationPoint[] {
    webgazer.showPredictionPoints(true);
    return this.calibrationPoints;
  }

  /**
   * Hide calibration interface
   */
  hideCalibration(): void {
    webgazer.showPredictionPoints(false);
  }

  /**
   * Start tracking gaze data
   */
  startTracking(): void {
    this.gazeData = [];
    this.isTracking = true;
    webgazer.resume();
    console.log('Gaze tracking started');
  }

  /**
   * Stop tracking gaze data
   */
  stopTracking(): void {
    this.isTracking = false;
    webgazer.pause();
    console.log('Gaze tracking stopped');
  }

  /**
   * Get collected gaze data
   */
  getGazeData(): GazeData[] {
    return [...this.gazeData];
  }

  /**
   * Clear collected gaze data
   */
  clearGazeData(): void {
    this.gazeData = [];
  }

  /**
   * Get gaze statistics
   */
  getGazeStatistics() {
    if (this.gazeData.length === 0) {
      return null;
    }

    const xValues = this.gazeData.map(d => d.x);
    const yValues = this.gazeData.map(d => d.y);

    return {
      totalPoints: this.gazeData.length,
      duration: this.gazeData[this.gazeData.length - 1].timestamp - this.gazeData[0].timestamp,
      averageX: xValues.reduce((a, b) => a + b, 0) / xValues.length,
      averageY: yValues.reduce((a, b) => a + b, 0) / yValues.length,
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues),
    };
  }

  /**
   * End gaze tracking session and cleanup
   */
  async end(): Promise<void> {
    this.stopTracking();
    await webgazer.end();
    console.log('WebGazer ended');
  }

  /**
   * Check if tracking is active
   */
  isActive(): boolean {
    return this.isTracking;
  }
}

// Export singleton instance
export const gazeTrackingService = new GazeTrackingService();

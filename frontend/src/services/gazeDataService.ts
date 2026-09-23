import { io, Socket } from 'socket.io-client';
import { GazePoint, Fixation, Saccade, CalibrationPoint } from '../types/gaze.types';
import { WordGazeData, ReadingMetrics } from '../utils/wordTracker';

/**
 * Gaze Session Data Interface
 * Complete session data for backend storage
 */
export interface GazeSessionData {
  sessionId: string;
  userId: string;
  studentId: string;
  assessmentId?: string;
  materialId?: string;
  startTime: number;
  endTime?: number;
  calibrationData: CalibrationPoint[];
  gazePoints: GazePoint[];
  fixations: Fixation[];
  saccades: Saccade[];
  wordGazeData?: WordGazeData[];
  readingMetrics?: ReadingMetrics;
  metadata?: Record<string, any>;
}

/**
 * Gaze Data Service Class
 * 
 * Handles real-time communication with backend for gaze tracking data.
 * Uses WebSocket (Socket.io) for streaming gaze data and REST API for session management.
 * 
 * Features:
 * - WebSocket connection management
 * - Real-time gaze data streaming
 * - Session lifecycle management
 * - Automatic reconnection
 * - Data buffering during disconnection
 * - Batch sending optimization
 */
export class GazeDataService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private dataBuffer: GazePoint[] = [];
  private batchSize: number = 10;
  private batchTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Initialize WebSocket connection
   * @param token - JWT access token for authentication
   * @param baseURL - Backend base URL
   */
  public connect(token: string, baseURL: string = 'http://localhost:5000'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(baseURL, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts
        });

        this.socket.on('connect', () => {
          console.log('✅ Gaze tracking WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send buffered data if any
          this.flushBuffer();
          
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Gaze tracking WebSocket disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect after maximum attempts'));
          }
        });

        this.socket.on('gaze:ack', (data: { received: number; timestamp: number }) => {
          console.log(`✅ Backend acknowledged ${data.received} gaze points`);
        });

        this.socket.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      // Flush any remaining buffered data
      this.flushBuffer();
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Gaze tracking WebSocket disconnected');
    }
  }

  /**
   * Start a new gaze tracking session
   * @param sessionData - Initial session data
   * @returns Session ID
   */
  public async startSession(sessionData: Partial<GazeSessionData>): Promise<string> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('gaze:session:start', sessionData, (response: any) => {
        if (response.success) {
          this.sessionId = response.sessionId;
          console.log('✅ Gaze session started:', this.sessionId);
          resolve(this.sessionId);
        } else {
          reject(new Error(response.error || 'Failed to start session'));
        }
      });
    });
  }

  /**
   * End current gaze tracking session
   * @param finalData - Final session data
   */
  public async endSession(finalData?: Partial<GazeSessionData>): Promise<void> {
    if (!this.socket || !this.sessionId) {
      throw new Error('No active session to end');
    }

    // Flush remaining buffer
    this.flushBuffer();

    return new Promise((resolve, reject) => {
      this.socket!.emit('gaze:session:end', {
        sessionId: this.sessionId,
        ...finalData,
        endTime: Date.now()
      }, (response: any) => {
        if (response.success) {
          console.log('✅ Gaze session ended:', this.sessionId);
          this.sessionId = null;
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to end session'));
        }
      });
    });
  }

  /**
   * Send gaze point data (with batching)
   * @param gazePoint - Gaze point to send
   */
  public sendGazePoint(gazePoint: GazePoint): void {
    if (!this.socket || !this.sessionId) {
      console.warn('⚠️ No active session. Buffering gaze point.');
      this.dataBuffer.push(gazePoint);
      return;
    }

    if (!this.isConnected) {
      // Buffer data during disconnection
      this.dataBuffer.push(gazePoint);
      return;
    }

    // Add to buffer
    this.dataBuffer.push(gazePoint);

    // Send batch if size reached
    if (this.dataBuffer.length >= this.batchSize) {
      this.flushBuffer();
    } else {
      // Set timeout to send batch if not filled
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      this.batchTimeout = setTimeout(() => {
        this.flushBuffer();
      }, 1000); // Send after 1 second if batch not filled
    }
  }

  /**
   * Send fixation data
   * @param fixation - Fixation to send
   */
  public sendFixation(fixation: Fixation): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send fixation. Not connected or no active session.');
      return;
    }

    this.socket.emit('gaze:fixation', {
      sessionId: this.sessionId,
      fixation: fixation
    });
  }

  /**
   * Send saccade data
   * @param saccade - Saccade to send
   */
  public sendSaccade(saccade: Saccade): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send saccade. Not connected or no active session.');
      return;
    }

    this.socket.emit('gaze:saccade', {
      sessionId: this.sessionId,
      saccade: saccade
    });
  }

  /**
   * Send calibration data
   * @param calibrationPoints - Array of calibration points
   */
  public sendCalibrationData(calibrationPoints: CalibrationPoint[]): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send calibration. Not connected or no active session.');
      return;
    }

    this.socket.emit('gaze:calibration', {
      sessionId: this.sessionId,
      calibrationPoints: calibrationPoints
    });
  }

  /**
   * Send word-level gaze data
   * @param wordGazeData - Array of word gaze data
   */
  public sendWordGazeData(wordGazeData: WordGazeData[]): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send word gaze data. Not connected or no active session.');
      return;
    }

    this.socket.emit('gaze:word-data', {
      sessionId: this.sessionId,
      wordGazeData: wordGazeData
    });
  }

  /**
   * Send reading metrics
   * @param metrics - Reading metrics
   */
  public sendReadingMetrics(metrics: ReadingMetrics): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send reading metrics. Not connected or no active session.');
      return;
    }

    this.socket.emit('gaze:reading-metrics', {
      sessionId: this.sessionId,
      metrics: metrics
    });
  }

  /**
   * Flush buffered gaze points to server
   */
  private flushBuffer(): void {
    if (this.dataBuffer.length === 0) return;

    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot flush buffer. Not connected or no active session.');
      return;
    }

    // Clear batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Send batch
    this.socket.emit('gaze:batch', {
      sessionId: this.sessionId,
      gazePoints: [...this.dataBuffer]
    });

    console.log(`📤 Sent ${this.dataBuffer.length} gaze points to backend`);

    // Clear buffer
    this.dataBuffer = [];
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    hasActiveSession: boolean;
    bufferedPoints: number;
  } {
    return {
      isConnected: this.isConnected,
      hasActiveSession: !!this.sessionId,
      bufferedPoints: this.dataBuffer.length
    };
  }

  /**
   * Set batch size for gaze point batching
   * @param size - Batch size (number of points)
   */
  public setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(100, size)); // Between 1 and 100
  }
}

// Export singleton instance
export const gazeDataService = new GazeDataService();

export default GazeDataService;

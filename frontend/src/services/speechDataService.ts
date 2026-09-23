import { io, Socket } from 'socket.io-client';
import {
  SpeechRecognitionResult,
  WordRecognitionResult,
  PronunciationAssessment,
  ReadingFluencyMetrics,
  SpeechSessionData
} from '../types/speech.types';

/**
 * SpeechDataService Class
 * 
 * Handles real-time communication with backend for speech analysis data.
 * Uses WebSocket (Socket.io) for streaming speech data and REST API for session management.
 * 
 * Features:
 * - WebSocket connection management
 * - Real-time speech data streaming
 * - Session lifecycle management
 * - Audio blob upload
 * - Automatic reconnection
 * - Data buffering during disconnection
 */
export class SpeechDataService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private dataBuffer: SpeechRecognitionResult[] = [];
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
          console.log('✅ Speech analysis WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Send buffered data if any
          this.flushBuffer();
          
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Speech analysis WebSocket disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect after maximum attempts'));
          }
        });

        this.socket.on('speech:ack', (data: { received: boolean; timestamp: number }) => {
          console.log(`✅ Backend acknowledged speech data`);
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
      console.log('🔌 Speech analysis WebSocket disconnected');
    }
  }

  /**
   * Start a new speech analysis session
   * @param sessionData - Initial session data
   * @returns Session ID
   */
  public async startSession(sessionData: Partial<SpeechSessionData>): Promise<string> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('speech:session:start', sessionData, (response: any) => {
        if (response.success) {
          this.sessionId = response.sessionId;
          console.log('✅ Speech session started:', this.sessionId);
          resolve(this.sessionId);
        } else {
          reject(new Error(response.error || 'Failed to start session'));
        }
      });
    });
  }

  /**
   * End current speech analysis session
   * @param finalData - Final session data
   */
  public async endSession(finalData?: Partial<SpeechSessionData>): Promise<void> {
    if (!this.socket || !this.sessionId) {
      throw new Error('No active session to end');
    }

    // Flush remaining buffer
    this.flushBuffer();

    return new Promise((resolve, reject) => {
      this.socket!.emit('speech:session:end', {
        sessionId: this.sessionId,
        ...finalData,
        endTime: Date.now()
      }, (response: any) => {
        if (response.success) {
          console.log('✅ Speech session ended:', this.sessionId);
          this.sessionId = null;
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to end session'));
        }
      });
    });
  }

  /**
   * Send speech recognition result
   * @param result - Speech recognition result
   */
  public sendRecognitionResult(result: SpeechRecognitionResult): void {
    if (!this.socket || !this.sessionId) {
      console.warn('⚠️ No active session. Buffering recognition result.');
      this.dataBuffer.push(result);
      return;
    }

    if (!this.isConnected) {
      this.dataBuffer.push(result);
      return;
    }

    this.socket.emit('speech:recognition', {
      sessionId: this.sessionId,
      result: result
    });
  }

  /**
   * Send word recognition results
   * @param words - Array of word recognition results
   */
  public sendWordResults(words: WordRecognitionResult[]): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send word results. Not connected or no active session.');
      return;
    }

    this.socket.emit('speech:words', {
      sessionId: this.sessionId,
      words: words
    });
  }

  /**
   * Send pronunciation assessments
   * @param assessments - Array of pronunciation assessments
   */
  public sendPronunciationAssessments(assessments: PronunciationAssessment[]): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send pronunciation assessments. Not connected or no active session.');
      return;
    }

    this.socket.emit('speech:pronunciation', {
      sessionId: this.sessionId,
      assessments: assessments
    });
  }

  /**
   * Send fluency metrics
   * @param metrics - Reading fluency metrics
   */
  public sendFluencyMetrics(metrics: ReadingFluencyMetrics): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send fluency metrics. Not connected or no active session.');
      return;
    }

    this.socket.emit('speech:fluency-metrics', {
      sessionId: this.sessionId,
      metrics: metrics
    });
  }

  /**
   * Upload audio recording
   * @param audioBlob - Audio blob to upload
   */
  public async uploadAudio(audioBlob: Blob): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, `session_${this.sessionId}.webm`);
    formData.append('sessionId', this.sessionId);

    try {
      const token = localStorage.getItem('accessToken') || '';
      const response = await fetch('http://localhost:5000/api/speech/upload-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload audio');
      }

      console.log('✅ Audio uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to upload audio:', error);
      throw error;
    }
  }

  /**
   * Send interim transcript (real-time)
   * @param transcript - Interim transcript text
   */
  public sendInterimTranscript(transcript: string): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      return;
    }

    this.socket.emit('speech:interim', {
      sessionId: this.sessionId,
      transcript: transcript,
      timestamp: Date.now()
    });
  }

  /**
   * Send final transcript
   * @param transcript - Final transcript text
   */
  public sendFinalTranscript(transcript: string): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot send final transcript. Not connected or no active session.');
      return;
    }

    this.socket.emit('speech:final', {
      sessionId: this.sessionId,
      transcript: transcript,
      timestamp: Date.now()
    });
  }

  /**
   * Send pause event
   * @param duration - Pause duration in milliseconds
   */
  public sendPauseEvent(duration: number): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      return;
    }

    this.socket.emit('speech:pause', {
      sessionId: this.sessionId,
      duration: duration,
      timestamp: Date.now()
    });
  }

  /**
   * Send hesitation event
   * @param type - Type of hesitation
   * @param context - Context information
   */
  public sendHesitation(type: 'pause' | 'filler' | 'repetition', context?: string): void {
    if (!this.socket || !this.sessionId || !this.isConnected) {
      return;
    }

    this.socket.emit('speech:hesitation', {
      sessionId: this.sessionId,
      type: type,
      context: context,
      timestamp: Date.now()
    });
  }

  /**
   * Flush buffered recognition results to server
   */
  private flushBuffer(): void {
    if (this.dataBuffer.length === 0) return;

    if (!this.socket || !this.sessionId || !this.isConnected) {
      console.warn('⚠️ Cannot flush buffer. Not connected or no active session.');
      return;
    }

    // Send all buffered results
    this.dataBuffer.forEach(result => {
      this.socket!.emit('speech:recognition', {
        sessionId: this.sessionId,
        result: result
      });
    });

    console.log(`📤 Sent ${this.dataBuffer.length} buffered speech results to backend`);

    // Clear buffer
    this.dataBuffer = [];
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    isConnected: boolean;
    hasActiveSession: boolean;
    bufferedResults: number;
  } {
    return {
      isConnected: this.isConnected,
      hasActiveSession: !!this.sessionId,
      bufferedResults: this.dataBuffer.length
    };
  }

  /**
   * Get current session ID
   */
  public getCurrentSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export const speechDataService = new SpeechDataService();

export default SpeechDataService;

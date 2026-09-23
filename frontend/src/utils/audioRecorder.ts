/**
 * AudioRecorder Class
 * 
 * Records audio from microphone using MediaRecorder API.
 * Provides audio blob for backend analysis and playback.
 * 
 * Features:
 * - Microphone access
 * - Audio recording in WebM format
 * - Real-time audio level monitoring
 * - Pause/resume capability
 * - Audio blob export
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private onAudioLevelCallback: ((level: number) => void) | null = null;

  /**
   * Initialize audio recorder
   * @param onAudioLevel - Callback for real-time audio level (0-1)
   */
  public async initialize(onAudioLevel?: (level: number) => void): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('🎤 Microphone access granted');

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType
      });

      // Setup audio level monitoring
      if (onAudioLevel) {
        this.onAudioLevelCallback = onAudioLevel;
        this.setupAudioLevelMonitoring();
      }

      // Event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log('🎙️ Recording started');
        this.audioChunks = [];
        if (this.onAudioLevelCallback) {
          this.startAudioLevelMonitoring();
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped');
        this.stopAudioLevelMonitoring();
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
      };

      console.log('✅ Audio recorder initialized with', mimeType);

    } catch (error: any) {
      console.error('❌ Failed to initialize audio recorder:', error);
      throw new Error(`Failed to access microphone: ${error.message}`);
    }
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return ''; // Use default
  }

  /**
   * Setup audio level monitoring using Web Audio API
   */
  private setupAudioLevelMonitoring(): void {
    if (!this.stream) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      source.connect(this.analyser);
      
      console.log('✅ Audio level monitoring setup complete');
    } catch (error) {
      console.error('❌ Failed to setup audio level monitoring:', error);
    }
  }

  /**
   * Start monitoring audio levels
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser || !this.dataArray || !this.onAudioLevelCallback) return;

    const monitor = () => {
      if (!this.analyser || !this.dataArray) return;

      this.analyser.getByteTimeDomainData(this.dataArray);

      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const normalized = (this.dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      
      // Normalize to 0-1 range
      const level = Math.min(1, rms * 5);

      if (this.onAudioLevelCallback) {
        this.onAudioLevelCallback(level);
      }

      this.animationFrameId = requestAnimationFrame(monitor);
    };

    monitor();
  }

  /**
   * Stop monitoring audio levels
   */
  private stopAudioLevelMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Start recording
   */
  public startRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.mediaRecorder.state === 'recording') {
      console.warn('Already recording');
      return;
    }

    this.audioChunks = [];
    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  /**
   * Stop recording
   * @returns Audio blob
   */
  public stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Audio recorder not initialized'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        console.warn('Not recording');
        resolve(new Blob(this.audioChunks));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm'
        });
        console.log(`✅ Recording stopped. Audio size: ${(audioBlob.size / 1024).toFixed(2)} KB`);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  public pauseRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('⏸️ Recording paused');
    }
  }

  /**
   * Resume recording
   */
  public resumeRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('Audio recorder not initialized');
    }

    if (this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('▶️ Recording resumed');
    }
  }

  /**
   * Get current recording state
   */
  public getState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  /**
   * Get audio blob from current chunks
   */
  public getAudioBlob(): Blob {
    return new Blob(this.audioChunks, { 
      type: this.mediaRecorder?.mimeType || 'audio/webm'
    });
  }

  /**
   * Create audio URL for playback
   */
  public createAudioURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopAudioLevelMonitoring();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
    this.dataArray = null;
    this.audioChunks = [];
    this.onAudioLevelCallback = null;

    console.log('🧹 Audio recorder cleaned up');
  }

  /**
   * Check if browser supports audio recording
   */
  public static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }

  /**
   * Check microphone permission status
   */
  public static async checkPermission(): Promise<PermissionState> {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state;
    } catch (error) {
      console.warn('Permission API not supported');
      return 'prompt';
    }
  }
}

export default AudioRecorder;

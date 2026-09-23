export interface RecordingData {
  audioBlob: Blob;
  duration: number;
  sampleRate: number;
}

class SpeechRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private isRecording: boolean = false;

  /**
   * Initialize microphone access
   */
  async initialize(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      console.log('Microphone access granted');
    } catch (error) {
      console.error('Failed to access microphone:', error);
      throw new Error('Could not access microphone for speech recording');
    }
  }

  /**
   * Start recording audio
   */
  startRecording(): void {
    if (!this.stream) {
      throw new Error('Microphone not initialized. Call initialize() first.');
    }

    this.audioChunks = [];
    this.startTime = Date.now();

    // Create MediaRecorder with appropriate MIME type
    const mimeType = this.getSupportedMimeType();
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
    this.isRecording = true;
    console.log('Speech recording started');
  }

  /**
   * Stop recording audio
   */
  async stopRecording(): Promise<RecordingData> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording to stop'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const duration = Date.now() - this.startTime;
        const audioBlob = new Blob(this.audioChunks, { type: this.getSupportedMimeType() });
        
        const recordingData: RecordingData = {
          audioBlob,
          duration,
          sampleRate: 44100,
        };

        this.isRecording = false;
        resolve(recordingData);
      };

      this.mediaRecorder.stop();
      console.log('Speech recording stopped');
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('Speech recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('Speech recording resumed');
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
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Convert blob to WAV format (for better compatibility)
   */
  async convertToWav(audioBlob: Blob): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const wavBlob = await this.audioBufferToWav(audioBuffer);
    return wavBlob;
  }

  /**
   * Convert AudioBuffer to WAV Blob
   */
  private async audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;

    const data = new Float32Array(audioBuffer.length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < audioBuffer.length; i++) {
        data[i * numberOfChannels + channel] = channelData[i];
      }
    }

    const dataLength = data.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < data.length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Get recording status
   */
  getRecordingStatus(): {
    isRecording: boolean;
    duration: number;
    state: string;
  } {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? Date.now() - this.startTime : 0,
      state: this.mediaRecorder?.state || 'inactive',
    };
  }

  /**
   * Cleanup and release microphone
   */
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    console.log('Speech recording service cleaned up');
  }

  /**
   * Check if recording is active
   */
  isActive(): boolean {
    return this.isRecording;
  }
}

// Export singleton instance
export const speechRecordingService = new SpeechRecordingService();

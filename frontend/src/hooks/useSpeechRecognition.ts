import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SpeechRecognitionResult,
  SpeechRecognitionConfig,
  SpeechRecognitionState,
  WordRecognitionResult
} from '../types/speech.types';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onResult?: (result: SpeechRecognitionResult) => void;
  onFinalResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * useSpeechRecognition Hook
 * 
 * Custom React hook for Web Speech API integration.
 * Provides speech-to-text functionality with real-time transcription.
 * 
 * Features:
 * - Browser-based speech recognition
 * - Real-time and final transcripts
 * - Confidence scores
 * - Word timing (when available)
 * - Pause/resume capability
 * - Error handling
 * 
 * @param options - Configuration options
 */
export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    language = 'id-ID', // Indonesian by default
    continuous = true,
    interimResults = true,
    maxAlternatives = 3,
    onResult,
    onFinalResult,
    onError,
    onStart,
    onEnd
  } = options;

  const [state, setState] = useState<SpeechRecognitionState>({
    isInitialized: false,
    isListening: false,
    isPaused: false,
    currentTranscript: '',
    finalTranscript: '',
    confidence: 0,
    error: null
  });

  const [results, setResults] = useState<SpeechRecognitionResult[]>([]);
  const [wordResults, setWordResults] = useState<WordRecognitionResult[]>([]);

  const recognitionRef = useRef<any>(null);
  const isStoppedManually = useRef(false);
  const startTimeRef = useRef<number>(0);

  /**
   * Check if browser supports Speech Recognition
   */
  const isSupported = useCallback(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  /**
   * Initialize speech recognition
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (!isSupported()) {
      const error = 'Speech Recognition is not supported in this browser';
      setState(prev => ({ ...prev, error }));
      if (onError) onError(error);
      throw new Error(error);
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Configure recognition
      recognition.lang = language;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      // Event handlers
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        startTimeRef.current = Date.now();
        setState(prev => ({ 
          ...prev, 
          isListening: true, 
          isPaused: false,
          error: null 
        }));
        if (onStart) onStart();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          if (result.isFinal) {
            finalTranscript += transcript + ' ';

            // Create result object
            const speechResult: SpeechRecognitionResult = {
              transcript: transcript.trim(),
              confidence: confidence || 0,
              isFinal: true,
              timestamp: Date.now(),
              alternatives: Array.from({ length: result.length }, (_, idx) => 
                result[idx].transcript
              )
            };

            setResults(prev => [...prev, speechResult]);

            // Extract word timing if available
            if (result[0].words) {
              const words: WordRecognitionResult[] = result[0].words.map((word: any) => ({
                word: word.word,
                confidence: word.confidence || confidence,
                startTime: word.startTime || 0,
                endTime: word.endTime || 0,
                duration: (word.endTime || 0) - (word.startTime || 0)
              }));
              setWordResults(prev => [...prev, ...words]);
            }

            if (onFinalResult) onFinalResult(speechResult);
          } else {
            interimTranscript += transcript;

            const speechResult: SpeechRecognitionResult = {
              transcript: transcript.trim(),
              confidence: confidence || 0,
              isFinal: false,
              timestamp: Date.now()
            };

            if (onResult) onResult(speechResult);
          }
        }

        setState(prev => ({
          ...prev,
          currentTranscript: interimTranscript.trim(),
          finalTranscript: prev.finalTranscript + finalTranscript,
          confidence: event.results[event.results.length - 1][0].confidence || 0
        }));
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        const errorMessage = `Speech recognition error: ${event.error}`;
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage,
          isListening: false
        }));

        if (onError) onError(errorMessage);

        // Auto-restart on network error (if not stopped manually)
        if (event.error === 'network' && !isStoppedManually.current && continuous) {
          console.log('🔄 Attempting to restart after network error...');
          setTimeout(() => {
            if (recognitionRef.current && !isStoppedManually.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Failed to restart:', e);
              }
            }
          }, 1000);
        }
      };

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setState(prev => ({ ...prev, isListening: false }));
        
        if (onEnd) onEnd();

        // Auto-restart if continuous and not stopped manually
        if (continuous && !isStoppedManually.current) {
          console.log('🔄 Auto-restarting speech recognition...');
          setTimeout(() => {
            if (recognitionRef.current && !isStoppedManually.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Ignore if already started
                console.log('Recognition already started or not available');
              }
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      setState(prev => ({ ...prev, isInitialized: true, error: null }));
      console.log('✅ Speech recognition initialized');

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initialize speech recognition';
      setState(prev => ({ ...prev, error: errorMessage }));
      if (onError) onError(errorMessage);
      throw error;
    }
  }, [language, continuous, interimResults, maxAlternatives, onResult, onFinalResult, onError, onStart, onEnd, isSupported]);

  /**
   * Start listening
   */
  const startListening = useCallback((): void => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (state.isListening) {
      console.log('Already listening');
      return;
    }

    try {
      isStoppedManually.current = false;
      recognitionRef.current.start();
      console.log('🎤 Started listening...');
    } catch (error: any) {
      if (error.message !== 'recognition has already started') {
        console.error('Failed to start listening:', error);
        setState(prev => ({ ...prev, error: error.message }));
        if (onError) onError(error.message);
      }
    }
  }, [state.isListening, onError]);

  /**
   * Stop listening
   */
  const stopListening = useCallback((): void => {
    if (!recognitionRef.current) return;

    try {
      isStoppedManually.current = true;
      recognitionRef.current.stop();
      setState(prev => ({ ...prev, isListening: false, isPaused: false }));
      console.log('🛑 Stopped listening');
    } catch (error: any) {
      console.error('Failed to stop listening:', error);
    }
  }, []);

  /**
   * Pause listening (abort current recognition)
   */
  const pauseListening = useCallback((): void => {
    if (!recognitionRef.current || !state.isListening) return;

    try {
      recognitionRef.current.abort();
      setState(prev => ({ ...prev, isPaused: true, isListening: false }));
      console.log('⏸️ Paused listening');
    } catch (error: any) {
      console.error('Failed to pause listening:', error);
    }
  }, [state.isListening]);

  /**
   * Resume listening
   */
  const resumeListening = useCallback((): void => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      isStoppedManually.current = false;
      recognitionRef.current.start();
      setState(prev => ({ ...prev, isPaused: false }));
      console.log('▶️ Resumed listening');
    } catch (error: any) {
      if (error.message !== 'recognition has already started') {
        console.error('Failed to resume listening:', error);
      }
    }
  }, [state.isListening]);

  /**
   * Reset transcript and results
   */
  const reset = useCallback((): void => {
    setResults([]);
    setWordResults([]);
    setState(prev => ({
      ...prev,
      currentTranscript: '',
      finalTranscript: '',
      confidence: 0,
      error: null
    }));
    console.log('🔄 Reset speech recognition state');
  }, []);

  /**
   * Cleanup
   */
  const cleanup = useCallback((): void => {
    if (recognitionRef.current) {
      try {
        isStoppedManually.current = true;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
    setState({
      isInitialized: false,
      isListening: false,
      isPaused: false,
      currentTranscript: '',
      finalTranscript: '',
      confidence: 0,
      error: null
    });
    setResults([]);
    setWordResults([]);
    console.log('🧹 Speech recognition cleaned up');
  }, []);

  /**
   * Get configuration
   */
  const getConfig = useCallback((): SpeechRecognitionConfig => {
    return {
      language,
      continuous,
      interimResults,
      maxAlternatives
    };
  }, [language, continuous, interimResults, maxAlternatives]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    ...state,
    results,
    wordResults,
    
    // Methods
    isSupported,
    initialize,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    reset,
    cleanup,
    getConfig
  };
};

export default useSpeechRecognition;

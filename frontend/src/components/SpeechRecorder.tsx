import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  IconButton,
  Chip,
  Alert
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  FiberManualRecord as RecordIcon
} from '@mui/icons-material';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { AudioRecorder } from '../utils/audioRecorder';

interface SpeechRecorderProps {
  expectedText?: string;
  onRecordingComplete?: (audioBlob: Blob, transcript: string) => void;
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  language?: string;
}

/**
 * SpeechRecorder Component
 * 
 * Records audio and performs real-time speech recognition.
 * Displays live transcript and audio level visualization.
 * 
 * Features:
 * - Audio recording with MediaRecorder
 * - Real-time speech recognition
 * - Audio level visualization
 * - Pause/resume capability
 * - Transcript display
 */
const SpeechRecorder: React.FC<SpeechRecorderProps> = ({
  expectedText,
  onRecordingComplete,
  onTranscriptUpdate,
  language = 'id-ID'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isInitialized,
    isListening,
    currentTranscript,
    finalTranscript,
    confidence,
    error: speechError,
    initialize: initializeSpeech,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    reset: resetSpeech,
    cleanup: cleanupSpeech
  } = useSpeechRecognition({
    language,
    continuous: true,
    interimResults: true,
    onResult: (result) => {
      if (onTranscriptUpdate) {
        onTranscriptUpdate(result.transcript, result.isFinal);
      }
    },
    onFinalResult: (result) => {
      console.log('Final result:', result.transcript, 'Confidence:', result.confidence);
    },
    onError: (err) => {
      setError(err);
    }
  });

  // Initialize on mount
  useEffect(() => {
    handleInitialize();

    return () => {
      handleCleanup();
    };
  }, []);

  // Update transcript callback
  useEffect(() => {
    if (onTranscriptUpdate && (currentTranscript || finalTranscript)) {
      const fullTranscript = finalTranscript + ' ' + currentTranscript;
      onTranscriptUpdate(fullTranscript.trim(), !currentTranscript);
    }
  }, [currentTranscript, finalTranscript, onTranscriptUpdate]);

  const handleInitialize = async () => {
    try {
      setError(null);

      // Initialize speech recognition
      await initializeSpeech();

      // Initialize audio recorder
      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.initialize((level) => {
        setAudioLevel(level);
      });

      console.log('✅ Speech recorder initialized');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize recorder');
      console.error('Initialization error:', err);
    }
  };

  const handleStartRecording = async () => {
    if (!audioRecorderRef.current || !isInitialized) {
      setError('Recorder not initialized');
      return;
    }

    try {
      setError(null);
      
      // Start audio recording
      audioRecorderRef.current.startRecording();
      
      // Start speech recognition
      startListening();
      
      // Start duration timer
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      setIsRecording(true);
      setIsPaused(false);
      console.log('🎤 Started recording');
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      console.error('Start recording error:', err);
    }
  };

  const handleStopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop audio recording
      const blob = await audioRecorderRef.current.stopRecording();
      setAudioBlob(blob);

      // Stop speech recognition
      stopListening();

      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);

      console.log('🛑 Stopped recording');

      // Callback with results
      if (onRecordingComplete) {
        const fullTranscript = (finalTranscript + ' ' + currentTranscript).trim();
        onRecordingComplete(blob, fullTranscript);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      console.error('Stop recording error:', err);
    }
  };

  const handlePauseRecording = () => {
    if (!audioRecorderRef.current) return;

    try {
      audioRecorderRef.current.pauseRecording();
      pauseListening();
      setIsPaused(true);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      console.log('⏸️ Paused recording');
    } catch (err: any) {
      setError(err.message || 'Failed to pause recording');
    }
  };

  const handleResumeRecording = () => {
    if (!audioRecorderRef.current) return;

    try {
      audioRecorderRef.current.resumeRecording();
      resumeListening();
      setIsPaused(false);

      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      console.log('▶️ Resumed recording');
    } catch (err: any) {
      setError(err.message || 'Failed to resume recording');
    }
  };

  const handleCleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.cleanup();
    }
    cleanupSpeech();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Speech Recording
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {isRecording && (
              <Chip
                icon={<RecordIcon sx={{ animation: 'pulse 1.5s infinite' }} />}
                label={formatDuration(duration)}
                color="error"
                size="small"
              />
            )}
            <Chip
              label={isListening ? 'Listening' : 'Not Listening'}
              color={isListening ? 'success' : 'default'}
              size="small"
            />
            <Chip
              label={`Confidence: ${(confidence * 100).toFixed(0)}%`}
              size="small"
            />
          </Stack>
        </Box>

        {(error || speechError) && (
          <Alert severity="error">{error || speechError}</Alert>
        )}

        {/* Audio Level Visualization */}
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Audio Level
          </Typography>
          <LinearProgress
            variant="determinate"
            value={audioLevel * 100}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'action.disabledBackground'
            }}
            color={audioLevel > 0.7 ? 'error' : audioLevel > 0.3 ? 'success' : 'primary'}
          />
        </Box>

        {/* Expected Text (if provided) */}
        {expectedText && (
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Expected Text:
            </Typography>
            <Typography variant="body2">
              {expectedText}
            </Typography>
          </Paper>
        )}

        {/* Live Transcript */}
        <Paper variant="outlined" sx={{ p: 2, minHeight: 100, maxHeight: 200, overflow: 'auto' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Live Transcript:
          </Typography>
          <Typography variant="body1">
            {finalTranscript && (
              <span style={{ color: 'inherit' }}>{finalTranscript} </span>
            )}
            {currentTranscript && (
              <span style={{ color: 'text.secondary', fontStyle: 'italic' }}>
                {currentTranscript}
              </span>
            )}
            {!finalTranscript && !currentTranscript && (
              <span style={{ color: 'text.disabled', fontStyle: 'italic' }}>
                Start speaking...
              </span>
            )}
          </Typography>
        </Paper>

        {/* Controls */}
        <Box display="flex" justifyContent="center" gap={2}>
          {!isRecording ? (
            <Button
              variant="contained"
              size="large"
              startIcon={<MicIcon />}
              onClick={handleStartRecording}
              disabled={!isInitialized}
            >
              Start Recording
            </Button>
          ) : (
            <>
              {!isPaused ? (
                <IconButton
                  color="warning"
                  size="large"
                  onClick={handlePauseRecording}
                >
                  <PauseIcon fontSize="large" />
                </IconButton>
              ) : (
                <IconButton
                  color="primary"
                  size="large"
                  onClick={handleResumeRecording}
                >
                  <PlayIcon fontSize="large" />
                </IconButton>
              )}
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<StopIcon />}
                onClick={handleStopRecording}
              >
                Stop Recording
              </Button>
            </>
          )}
        </Box>

        {/* Playback (if audio available) */}
        {audioBlob && !isRecording && (
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Recording Playback:
            </Typography>
            <audio
              controls
              src={audioRecorderRef.current?.createAudioURL(audioBlob)}
              style={{ width: '100%' }}
            />
          </Box>
        )}
      </Stack>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Paper>
  );
};

export default SpeechRecorder;

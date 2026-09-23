import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Stack,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Mic as MicIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import SpeechRecorder from './SpeechRecorder';
import PronunciationResults from './PronunciationResults';
import { PronunciationAnalyzer } from '../utils/pronunciationAnalyzer';
import { speechDataService } from '../services/speechDataService';
import {
  ReadingFluencyMetrics,
  PronunciationAssessment,
  ReadingError
} from '../types/speech.types';

interface SpeechAssessmentSessionProps {
  userId: string;
  studentId: string;
  assessmentId?: string;
  materialId?: string;
  expectedText: string;
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}

/**
 * SpeechAssessmentSession Component
 * 
 * Complete speech assessment workflow:
 * 1. Setup and instructions
 * 2. Recording with real-time speech recognition
 * 3. Analysis and results
 * 
 * Integrates:
 * - Speech recognition (Web Speech API)
 * - Audio recording (MediaRecorder)
 * - Pronunciation analysis
 * - Backend data streaming
 */
const SpeechAssessmentSession: React.FC<SpeechAssessmentSessionProps> = ({
  userId,
  studentId,
  assessmentId,
  materialId,
  expectedText,
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Analysis results
  const [pronunciationAssessments, setPronunciationAssessments] = useState<PronunciationAssessment[]>([]);
  const [fluencyMetrics, setFluencyMetrics] = useState<ReadingFluencyMetrics | null>(null);
  const [errors, setErrors] = useState<ReadingError[]>([]);

  const pronounceAnalyzerRef = useRef(new PronunciationAnalyzer());
  const recordingStartTime = useRef<number>(0);

  const steps = ['Instructions', 'Recording', 'Results'];

  // Initialize on mount
  useEffect(() => {
    handleInitialize();

    return () => {
      handleCleanup();
    };
  }, []);

  const handleInitialize = async () => {
    try {
      // Connect to backend WebSocket
      const token = localStorage.getItem('accessToken') || '';
      await speechDataService.connect(token);

      // Set expected text in analyzer
      pronounceAnalyzerRef.current.setExpectedText(expectedText);

      console.log('✅ Speech assessment initialized');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize speech assessment');
      console.error('Initialization error:', err);
    }
  };

  const handleStartRecording = async () => {
    try {
      setError(null);

      // Start speech session
      const newSessionId = await speechDataService.startSession({
        userId,
        studentId,
        assessmentId,
        materialId,
        startTime: Date.now(),
        expectedText
      });

      setSessionId(newSessionId);
      recordingStartTime.current = Date.now();
      setActiveStep(1); // Move to recording

      console.log('✅ Speech session started:', newSessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording session');
      console.error('Start session error:', err);
    }
  };

  const handleRecordingComplete = async (blob: Blob, transcript: string) => {
    try {
      setError(null);
      setAudioBlob(blob);
      setRecognizedText(transcript);
      setIsAnalyzing(true);

      console.log('📝 Transcript:', transcript);

      // Set recognized text in analyzer
      pronounceAnalyzerRef.current.setRecognizedText(transcript);
      pronounceAnalyzerRef.current.setSessionTiming(
        recordingStartTime.current,
        Date.now()
      );

      // Perform analysis
      const analysisResults = pronounceAnalyzerRef.current.exportData();

      setPronunciationAssessments(analysisResults.pronunciationAssessments);
      setFluencyMetrics(analysisResults.fluencyMetrics);
      setErrors(analysisResults.errors);

      // Send data to backend
      speechDataService.sendPronunciationAssessments(analysisResults.pronunciationAssessments);
      speechDataService.sendFluencyMetrics(analysisResults.fluencyMetrics);
      speechDataService.sendFinalTranscript(transcript);

      // Upload audio
      try {
        await speechDataService.uploadAudio(blob);
      } catch (uploadErr) {
        console.warn('Audio upload failed, continuing anyway:', uploadErr);
      }

      // End session
      await speechDataService.endSession({
        endTime: Date.now(),
        recognitionResults: [],
        wordResults: [],
        pronunciationAssessments: analysisResults.pronunciationAssessments,
        fluencyMetrics: analysisResults.fluencyMetrics
      });

      setIsAnalyzing(false);
      setActiveStep(2); // Move to results

      // Call completion callback
      if (onComplete) {
        onComplete({
          sessionId,
          recognizedText: transcript,
          pronunciationAssessments: analysisResults.pronunciationAssessments,
          fluencyMetrics: analysisResults.fluencyMetrics,
          errors: analysisResults.errors,
          audioBlob: blob
        });
      }

      console.log('✅ Analysis complete');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze speech');
      setIsAnalyzing(false);
      console.error('Analysis error:', err);
    }
  };

  const handleTranscriptUpdate = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      speechDataService.sendFinalTranscript(transcript);
    } else {
      speechDataService.sendInterimTranscript(transcript);
    }
  };

  const handleCleanup = () => {
    speechDataService.disconnect();
    pronounceAnalyzerRef.current.reset();
  };

  const handleRetry = () => {
    setActiveStep(0);
    setError(null);
    setRecognizedText('');
    setAudioBlob(null);
    setPronunciationAssessments([]);
    setFluencyMetrics(null);
    setErrors([]);
    pronounceAnalyzerRef.current.reset();
    pronounceAnalyzerRef.current.setExpectedText(expectedText);
  };

  const handleCancel = () => {
    handleCleanup();
    if (onCancel) {
      onCancel();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Instructions
        return (
          <Stack spacing={3}>
            <Box textAlign="center" py={4}>
              <MicIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Reading Assessment Instructions
              </Typography>
              <Typography variant="body1" color="text.secondary" maxWidth="md" mx="auto" paragraph>
                You will be asked to read the following text aloud. 
                Please read clearly and at a comfortable pace.
              </Typography>
            </Box>

            <Paper elevation={2} sx={{ p: 3, backgroundColor: 'action.hover' }}>
              <Typography variant="h6" gutterBottom>
                Text to Read:
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {expectedText}
              </Typography>
            </Paper>

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Tips:</strong>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>Find a quiet environment</li>
                  <li>Speak clearly into your microphone</li>
                  <li>Read at your natural pace</li>
                  <li>You can pause and resume if needed</li>
                </ul>
              </Typography>
            </Alert>

            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<MicIcon />}
                onClick={handleStartRecording}
              >
                Start Recording
              </Button>
            </Box>
          </Stack>
        );

      case 1:
        // Recording
        return (
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <SpeechRecorder
              expectedText={expectedText}
              onRecordingComplete={handleRecordingComplete}
              onTranscriptUpdate={handleTranscriptUpdate}
              language="id-ID"
            />

            {isAnalyzing && (
              <Box textAlign="center" py={2}>
                <Typography variant="h6" gutterBottom>
                  Analyzing your reading...
                </Typography>
                <LinearProgress sx={{ mt: 2 }} />
              </Box>
            )}
          </Stack>
        );

      case 2:
        // Results
        return (
          <Stack spacing={3}>
            <Box textAlign="center" py={2}>
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Assessment Complete
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Session ID: {sessionId}
              </Typography>
            </Box>

            {fluencyMetrics && (
              <PronunciationResults
                pronunciationAssessments={pronunciationAssessments}
                fluencyMetrics={fluencyMetrics}
                errors={errors}
                expectedText={expectedText}
                recognizedText={recognizedText}
              />
            )}

            <Box display="flex" justifyContent="center" gap={2}>
              <Button variant="outlined" onClick={handleRetry}>
                New Assessment
              </Button>
              <Button
                variant="contained"
                onClick={() => onComplete && onComplete({
                  sessionId,
                  fluencyMetrics,
                  pronunciationAssessments,
                  errors
                })}
              >
                View Full Report
              </Button>
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Speech Assessment Session
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </Paper>
    </Box>
  );
};

export default SpeechAssessmentSession;

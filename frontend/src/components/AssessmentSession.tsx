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
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import GazeCalibration from './GazeCalibration';
import GazeOverlay from './GazeOverlay';
import GazeHeatmap from './GazeHeatmap';
import { useGazeTracking } from '../hooks/useGazeTracking';
import { WordTracker } from '../utils/wordTracker';
import { gazeDataService } from '../services/gazeDataService';
import { GazePoint, CalibrationPoint } from '../types/gaze.types';

interface AssessmentSessionProps {
  userId: string;
  studentId: string;
  assessmentId?: string;
  materialId?: string;
  readingText: string;
  onComplete?: (results: any) => void;
  onCancel?: () => void;
}

/**
 * AssessmentSession Component
 * 
 * Complete gaze tracking assessment workflow:
 * 1. Calibration
 * 2. Reading session with tracking
 * 3. Results and analysis
 * 
 * Integrates:
 * - WebGazer.js gaze tracking
 * - Calibration UI
 * - Real-time visualization
 * - Word-level analysis
 * - Backend data streaming
 */
const AssessmentSession: React.FC<AssessmentSessionProps> = ({
  userId,
  studentId,
  assessmentId,
  materialId,
  readingText,
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number>(0);
  const [gazePoints, setGazePoints] = useState<GazePoint[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textContainerRef = useRef<HTMLDivElement>(null);
  const wordTracker = useRef(new WordTracker());

  const {
    isInitialized,
    isCalibrating,
    isTracking,
    calibrationProgress,
    calibrationAccuracy,
    currentGazePoint,
    fixations,
    saccades,
    calibrationPoints,
    initialize,
    startCalibration,
    validateCalibration,
    startTracking,
    stopTracking,
    cleanup
  } = useGazeTracking({
    onGazeUpdate: (point) => {
      setGazePoints(prev => [...prev, point]);
      
      // Send to backend
      if (sessionId) {
        gazeDataService.sendGazePoint(point);
      }
    },
    onFixation: (fixation) => {
      // Process fixation with word tracker
      if (isReading) {
        wordTracker.current.processFixation(fixation);
      }
      
      // Send to backend
      if (sessionId) {
        gazeDataService.sendFixation(fixation);
      }
    },
    onSaccade: (saccade) => {
      // Send to backend
      if (sessionId) {
        gazeDataService.sendSaccade(saccade);
      }
    }
  });

  const steps = ['Setup', 'Calibration', 'Reading', 'Results'];

  // Initialize on mount
  useEffect(() => {
    handleInitialize();

    return () => {
      handleCleanup();
    };
  }, []);

  const handleInitialize = async () => {
    try {
      setError(null);
      await initialize();
      
      // Connect to backend WebSocket
      const token = localStorage.getItem('accessToken') || '';
      await gazeDataService.connect(token);
      
      setActiveStep(1); // Move to calibration
    } catch (err: any) {
      setError(err.message || 'Failed to initialize gaze tracking');
      console.error('Initialization error:', err);
    }
  };

  const handleStartCalibration = async () => {
    try {
      setError(null);
      await startCalibration();
    } catch (err: any) {
      setError(err.message || 'Failed to start calibration');
      console.error('Calibration error:', err);
    }
  };

  const handleCalibrationComplete = async () => {
    try {
      setError(null);
      const isValid = await validateCalibration();
      
      if (isValid) {
        // Send calibration data to backend
        gazeDataService.sendCalibrationData(calibrationPoints);
        
        // Start session
        const newSessionId = await gazeDataService.startSession({
          userId,
          studentId,
          assessmentId,
          materialId,
          startTime: Date.now(),
          calibrationData: calibrationPoints
        });
        
        setSessionId(newSessionId);
        setActiveStep(2); // Move to reading
      } else {
        setError('Calibration accuracy too low. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate calibration');
      console.error('Validation error:', err);
    }
  };

  const handleStartReading = async () => {
    try {
      setError(null);
      
      // Extract word positions
      if (textContainerRef.current) {
        wordTracker.current.extractWordPositions(textContainerRef.current);
      }
      
      // Start tracking
      await startTracking();
      setIsReading(true);
      setReadingStartTime(Date.now());
      setGazePoints([]); // Clear previous points
    } catch (err: any) {
      setError(err.message || 'Failed to start reading session');
      console.error('Reading error:', err);
    }
  };

  const handleStopReading = async () => {
    try {
      stopTracking();
      setIsReading(false);
      
      // Calculate metrics
      const metrics = wordTracker.current.calculateReadingMetrics();
      const wordGazeData = wordTracker.current.getAllWordGazeData();
      const difficultWords = wordTracker.current.getDifficultWords();
      
      // Send to backend
      gazeDataService.sendWordGazeData(wordGazeData);
      gazeDataService.sendReadingMetrics(metrics);
      
      // End session
      await gazeDataService.endSession({
        endTime: Date.now(),
        wordGazeData,
        readingMetrics: metrics,
        metadata: {
          difficultWords,
          totalGazePoints: gazePoints.length,
          totalFixations: fixations.length,
          totalSaccades: saccades.length
        }
      });
      
      setActiveStep(3); // Move to results
      
      // Call completion callback
      if (onComplete) {
        onComplete({
          sessionId,
          metrics,
          wordGazeData,
          difficultWords,
          gazePoints,
          fixations,
          saccades
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop reading session');
      console.error('Stop reading error:', err);
    }
  };

  const handleCleanup = () => {
    stopTracking();
    cleanup();
    gazeDataService.disconnect();
    wordTracker.current.reset();
  };

  const handleRetry = () => {
    setActiveStep(1);
    setError(null);
    setGazePoints([]);
    wordTracker.current.reset();
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
        // Setup
        return (
          <Box textAlign="center" py={4}>
            <VisibilityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Initializing Gaze Tracking
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              Please allow camera access when prompted
            </Typography>
            <LinearProgress />
          </Box>
        );

      case 1:
        // Calibration
        return (
          <Stack spacing={3}>
            <Alert severity="info">
              Please look at each point on the screen when it appears. Keep your head steady and follow with your eyes only.
            </Alert>

            {error && <Alert severity="error">{error}</Alert>}

            <GazeCalibration
              isCalibrating={isCalibrating}
              progress={calibrationProgress}
              onStart={handleStartCalibration}
              onComplete={handleCalibrationComplete}
            />

            {calibrationAccuracy !== null && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Calibration Accuracy
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress
                      variant="determinate"
                      value={calibrationAccuracy}
                      sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                      color={calibrationAccuracy >= 75 ? 'success' : 'warning'}
                    />
                    <Typography variant="h6" color={calibrationAccuracy >= 75 ? 'success.main' : 'warning.main'}>
                      {calibrationAccuracy.toFixed(1)}%
                    </Typography>
                  </Box>
                  {calibrationAccuracy < 75 && (
                    <Typography variant="body2" color="warning.main" mt={1}>
                      Accuracy below 75%. Consider recalibrating for better results.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Stack>
        );

      case 2:
        // Reading
        return (
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {isReading ? 'Reading in Progress...' : 'Ready to Start'}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip
                  label={`Gaze Points: ${gazePoints.length}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`Fixations: ${fixations.length}`}
                  color="secondary"
                  size="small"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  {showHeatmap ? 'Hide' : 'Show'} Heatmap
                </Button>
              </Stack>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Paper
              elevation={3}
              sx={{ position: 'relative', minHeight: 400, overflow: 'hidden' }}
            >
              {/* Reading text */}
              <Box
                ref={textContainerRef}
                sx={{
                  p: 4,
                  fontSize: '1.2rem',
                  lineHeight: 1.8,
                  fontFamily: 'Georgia, serif'
                }}
              >
                {readingText}
              </Box>

              {/* Gaze overlay */}
              {isTracking && !showHeatmap && (
                <GazeOverlay
                  currentGazePoint={currentGazePoint}
                  showTrail={true}
                  trailLength={10}
                />
              )}

              {/* Heatmap overlay */}
              {showHeatmap && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                  <GazeHeatmap
                    gazePoints={gazePoints}
                    width={textContainerRef.current?.offsetWidth || 800}
                    height={textContainerRef.current?.offsetHeight || 600}
                    title=""
                  />
                </Box>
              )}
            </Paper>

            <Box display="flex" justifyContent="center" gap={2}>
              {!isReading ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartReading}
                  startIcon={<VisibilityIcon />}
                >
                  Start Reading
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  onClick={handleStopReading}
                >
                  Stop Reading
                </Button>
              )}
            </Box>
          </Stack>
        );

      case 3:
        // Results
        const metrics = wordTracker.current.calculateReadingMetrics();
        const difficultWords = wordTracker.current.getDifficultWords();

        return (
          <Stack spacing={3}>
            <Box textAlign="center">
              <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Assessment Complete
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Session ID: {sessionId}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Reading Metrics
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Words Read:</Typography>
                        <Typography fontWeight="bold">
                          {metrics.wordsRead} / {metrics.totalWords}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Reading Speed:</Typography>
                        <Typography fontWeight="bold">
                          {metrics.readingSpeed.toFixed(0)} WPM
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Avg Fixation:</Typography>
                        <Typography fontWeight="bold">
                          {metrics.averageFixationDuration.toFixed(0)} ms
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Regression Rate:</Typography>
                        <Typography fontWeight="bold">
                          {metrics.regressionRate.toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Comprehension Score:</Typography>
                        <Typography fontWeight="bold" color="primary.main">
                          {(metrics.comprehensionIndicator * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tracking Data
                    </Typography>
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Gaze Points:</Typography>
                        <Typography fontWeight="bold">{gazePoints.length}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Fixations:</Typography>
                        <Typography fontWeight="bold">{fixations.length}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Saccades:</Typography>
                        <Typography fontWeight="bold">{saccades.length}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Difficult Words:</Typography>
                        <Typography fontWeight="bold" color="error.main">
                          {difficultWords.length}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Reading Time:</Typography>
                        <Typography fontWeight="bold">
                          {metrics.totalReadingTime.toFixed(1)}s
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <GazeHeatmap
              gazePoints={gazePoints}
              width={800}
              height={400}
              title="Gaze Distribution Heatmap"
              onClear={() => setGazePoints([])}
            />

            <Box display="flex" justifyContent="center" gap={2}>
              <Button variant="outlined" onClick={handleRetry}>
                Start New Assessment
              </Button>
              <Button
                variant="contained"
                onClick={() => onComplete && onComplete({ sessionId, metrics })}
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
          Reading Assessment Session
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        {activeStep > 0 && activeStep < 3 && (
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button onClick={handleCancel} color="error">
              Cancel Assessment
            </Button>
            {activeStep === 1 && calibrationAccuracy !== null && (
              <Button onClick={handleRetry} variant="outlined">
                Recalibrate
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AssessmentSession;

import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Card, CardContent, Button, Box, TextField, 
  Alert, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, 
  DialogActions, LinearProgress 
} from '@mui/material';
import { PlayArrow, Stop, Videocam, Mic, CheckCircle } from '@mui/icons-material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { gazeTrackingService } from '../../services/gazeTrackingService';
import { speechRecordingService } from '../../services/speechRecordingService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';

interface ReadingText {
  id: number;
  title: string;
  content: string;
  difficulty_level: string;
}

const StudentAssessment: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedText, setSelectedText] = useState<ReadingText | null>(null);
  const [readingTexts, setReadingTexts] = useState<ReadingText[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Fetch reading texts from Supabase
  useEffect(() => {
    fetchReadingTexts();
  }, []);

  // Update recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const fetchReadingTexts = async () => {
    try {
      const { data, error } = await supabase
        .from('reading_texts')
        .select('*')
        .order('difficulty_level', { ascending: true });

      if (error) throw error;
      setReadingTexts(data || []);
    } catch (err) {
      console.error('Error fetching reading texts:', err);
      setError('Gagal memuat teks bacaan');
    }
  };

  const handleStartCalibration = async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      // Initialize both services
      await gazeTrackingService.initialize();
      await speechRecordingService.initialize();
      
      setIsInitializing(false);
      setShowCalibration(true);
      setCalibrationStep(0);
    } catch (err: any) {
      setIsInitializing(false);
      setError(err.message || 'Gagal mengakses kamera/mikrofon');
    }
  };

  const handleCalibrationNext = () => {
    const calibrationPoints = gazeTrackingService.showCalibration();
    if (calibrationStep < calibrationPoints.length - 1) {
      setCalibrationStep(calibrationStep + 1);
    } else {
      // Calibration complete
      gazeTrackingService.hideCalibration();
      setShowCalibration(false);
      startRecording();
    }
  };

  const startRecording = () => {
    setRecordingDuration(0);
    gazeTrackingService.startTracking();
    speechRecordingService.startRecording();
    setIsRecording(true);
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsSubmitting(true);
    setError(null);

    try {
      // Stop tracking services
      gazeTrackingService.stopTracking();
      const recordingData = await speechRecordingService.stopRecording();

      // Get gaze data
      const gazeData = gazeTrackingService.getGazeData();
      const gazeStats = gazeTrackingService.getGazeStatistics();

      // Convert audio to WAV
      const audioWav = await speechRecordingService.convertToWav(recordingData.audioBlob);

      // Prepare assessment data
      const formData = new FormData();
      formData.append('user_id', user?.id || '');
      formData.append('text_id', selectedText?.id.toString() || '');
      formData.append('gaze_data', JSON.stringify(gazeData));
      formData.append('gaze_stats', JSON.stringify(gazeStats));
      formData.append('audio', audioWav, 'recording.wav');
      formData.append('duration', recordingData.duration.toString());

      // Submit to backend
      const response = await fetch('http://localhost:5000/api/assessments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim assessment');
      }

      const result = await response.json();
      
      setSuccess('Assessment berhasil dikirim! Hasil akan tersedia dalam beberapa saat.');
      
      // Cleanup
      gazeTrackingService.clearGazeData();
      await gazeTrackingService.end();
      speechRecordingService.cleanup();
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSelectedText(null);
        setSuccess(null);
      }, 3000);

    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setError(err.message || 'Gagal mengirim assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Assessment Baru 📝
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
            {success}
          </Alert>
        )}

        {!success && (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Pilih teks bacaan, lalu klik "Mulai Assessment" untuk memulai perekaman gaze tracking dan speech.
            </Alert>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Pilih Teks Bacaan</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {readingTexts.map((text) => (
                    <Button
                      key={text.id}
                      variant={selectedText?.id === text.id ? 'contained' : 'outlined'}
                      onClick={() => setSelectedText(text)}
                      disabled={isRecording}
                      sx={{ m: 0.5 }}
                    >
                      {text.title} ({text.difficulty_level})
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {selectedText && (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Teks Bacaan</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={selectedText.content}
                      InputProps={{ 
                        readOnly: true,
                        style: { fontSize: '1.1rem', lineHeight: '1.8' }
                      }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                      {!isRecording ? (
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={isInitializing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                          onClick={handleStartCalibration}
                          disabled={isInitializing}
                          color="primary"
                        >
                          {isInitializing ? 'Menginisialisasi...' : 'Mulai Assessment'}
                        </Button>
                      ) : (
                        <>
                          <Box sx={{ width: '100%', mb: 2 }}>
                            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                              Durasi: {formatDuration(recordingDuration)}
                            </Typography>
                            <LinearProgress />
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
                            <Chip icon={<Videocam />} label="Gaze Tracking Active" color="success" />
                            <Chip icon={<Mic />} label="Recording Speech" color="error" />
                          </Box>

                          <Button
                            variant="contained"
                            size="large"
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Stop />}
                            onClick={handleStopRecording}
                            disabled={isSubmitting}
                            color="error"
                          >
                            {isSubmitting ? 'Mengirim...' : 'Stop Assessment'}
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {/* Calibration Dialog */}
        <Dialog open={showCalibration} maxWidth="md" fullWidth>
          <DialogTitle>Kalibrasi Gaze Tracking</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Ikuti titik-titik pada layar dengan mata Anda untuk kalibrasi gaze tracking.
              Langkah {calibrationStep + 1} dari 5.
            </Alert>
            <Box 
              sx={{ 
                height: 400, 
                border: '2px dashed #ccc', 
                borderRadius: 2,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Lihat titik yang muncul di layar
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCalibrationNext} variant="contained">
              {calibrationStep < 4 ? 'Lanjut' : 'Mulai Recording'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
};

export default StudentAssessment;

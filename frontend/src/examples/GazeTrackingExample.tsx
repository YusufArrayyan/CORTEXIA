import React, { useState } from 'react';
import { Box, Container, Button, Typography } from '@mui/material';
import AssessmentSession from '../components/AssessmentSession';

/**
 * Example usage of the Gaze Tracking Assessment System
 * 
 * This demonstrates how to integrate the complete gaze tracking workflow
 * into your application.
 */
const GazeTrackingExample: React.FC = () => {
  const [showAssessment, setShowAssessment] = useState(false);

  // Sample reading text for assessment
  const sampleText = `
    Membaca adalah keterampilan penting yang mempengaruhi keberhasilan akademik siswa. 
    Kemampuan membaca yang baik memungkinkan siswa untuk memahami materi pelajaran dengan lebih efektif. 
    Namun, tidak semua siswa memiliki kemampuan membaca yang sama. 
    Beberapa siswa mengalami kesulitan dalam memahami teks, mengenali kata, atau mengikuti alur bacaan.
    
    Teknologi eye-tracking atau pelacakan mata dapat membantu mengidentifikasi pola membaca siswa. 
    Dengan menganalisis pergerakan mata saat membaca, kita dapat memahami bagaimana siswa memproses informasi. 
    Data seperti fixation (titik fokus pandangan) dan saccade (gerakan cepat mata antar kata) 
    memberikan wawasan tentang kesulitan membaca yang mungkin dialami siswa.
    
    Sistem CORTEXIA menggunakan webcam untuk melacak pergerakan mata secara real-time. 
    Tidak diperlukan perangkat khusus, cukup dengan kamera yang tersedia pada laptop atau komputer. 
    Hasil analisis dapat membantu guru memberikan intervensi yang tepat dan personal untuk setiap siswa.
  `;

  const handleAssessmentComplete = (results: any) => {
    console.log('Assessment completed:', results);
    alert(`Assessment Complete!\nReading Speed: ${results.metrics.readingSpeed.toFixed(0)} WPM\nComprehension Score: ${(results.metrics.comprehensionIndicator * 100).toFixed(0)}%`);
    setShowAssessment(false);
  };

  const handleAssessmentCancel = () => {
    console.log('Assessment cancelled');
    setShowAssessment(false);
  };

  return (
    <Container maxWidth="lg">
      {!showAssessment ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            gap: 3
          }}
        >
          <Typography variant="h3" gutterBottom>
            CORTEXIA Gaze Tracking
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" maxWidth="md">
            AI-Based Reading Difficulty Assessment using Webcam-Based Eye Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth="md" mt={2}>
            This assessment will:
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', maxWidth: 'md' }}>
            <li>
              <Typography variant="body1">
                Calibrate your eye tracking using a 9-point calibration grid
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Track your gaze while you read a passage
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Analyze reading patterns, fixations, and saccades
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Identify difficult words and comprehension indicators
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Generate detailed reading metrics and recommendations
              </Typography>
            </li>
          </Box>
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowAssessment(true)}
            sx={{ mt: 3 }}
          >
            Start Assessment
          </Button>
        </Box>
      ) : (
        <AssessmentSession
          userId="user-123"
          studentId="student-456"
          assessmentId="assessment-789"
          materialId="material-101"
          readingText={sampleText}
          onComplete={handleAssessmentComplete}
          onCancel={handleAssessmentCancel}
        />
      )}
    </Container>
  );
};

export default GazeTrackingExample;

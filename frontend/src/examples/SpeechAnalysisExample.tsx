import React, { useState } from 'react';
import { Box, Container, Button, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import SpeechAssessmentSession from '../components/SpeechAssessmentSession';

/**
 * Example usage of the Speech Analysis Assessment System
 * 
 * This demonstrates how to integrate the complete speech analysis workflow
 * into your application.
 */
const SpeechAnalysisExample: React.FC = () => {
  const [showAssessment, setShowAssessment] = useState(false);
  const [textLevel, setTextLevel] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Sample reading texts for different levels
  const sampleTexts = {
    easy: `
      Ibu pergi ke pasar pagi ini. 
      Dia membeli sayuran segar dan buah-buahan. 
      Kemudian ibu pulang ke rumah untuk memasak.
    `,
    medium: `
      Membaca adalah jendela ilmu pengetahuan. 
      Dengan membaca, kita dapat memperoleh berbagai informasi dan pengetahuan baru.
      Kebiasaan membaca sejak dini sangat penting untuk perkembangan kemampuan berpikir anak.
      Orang tua dan guru harus mendorong anak-anak untuk rajin membaca buku.
    `,
    hard: `
      Teknologi pendidikan modern telah mengalami transformasi yang signifikan dalam beberapa dekade terakhir.
      Integrasi kecerdasan buatan dan pembelajaran mesin memungkinkan personalisasi pendidikan yang lebih efektif.
      Sistem assessment berbasis multimodal dapat menganalisis berbagai aspek pembelajaran siswa secara komprehensif.
      Pendekatan adaptif ini membantu mengidentifikasi kesulitan belajar lebih dini dan memberikan intervensi yang tepat sasaran.
    `
  };

  const handleAssessmentComplete = (results: any) => {
    console.log('Assessment completed:', results);
    alert(`
Assessment Complete!
Accuracy: ${(results.fluencyMetrics.accuracy * 100).toFixed(0)}%
Reading Speed: ${results.fluencyMetrics.wordsPerMinute.toFixed(0)} WPM
Fluency Score: ${(results.fluencyMetrics.overallFluencyScore * 100).toFixed(0)}%
Errors: ${results.fluencyMetrics.incorrectWords}
    `);
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
            CORTEXIA Speech Analysis
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" maxWidth="md">
            AI-Based Reading Fluency Assessment using Speech Recognition
          </Typography>
          
          <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth="md" mt={2}>
            This assessment will:
          </Typography>
          <Box component="ul" sx={{ textAlign: 'left', maxWidth: 'md' }}>
            <li>
              <Typography variant="body1">
                Record your voice while reading a passage
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Recognize speech in real-time using Web Speech API
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Compare your pronunciation with the expected text
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Analyze reading fluency, prosody, and accuracy
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Identify mispronounced, omitted, or substituted words
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Generate detailed reading metrics and recommendations
              </Typography>
            </li>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom textAlign="center">
              Select Reading Level:
            </Typography>
            <ToggleButtonGroup
              value={textLevel}
              exclusive
              onChange={(_, newLevel) => {
                if (newLevel !== null) {
                  setTextLevel(newLevel);
                }
              }}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="easy">Easy</ToggleButton>
              <ToggleButton value="medium">Medium</ToggleButton>
              <ToggleButton value="hard">Hard</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => setShowAssessment(true)}
            sx={{ mt: 2 }}
          >
            Start Speech Assessment
          </Button>
        </Box>
      ) : (
        <SpeechAssessmentSession
          userId="user-123"
          studentId="student-456"
          assessmentId="assessment-789"
          materialId="material-101"
          expectedText={sampleTexts[textLevel].trim()}
          onComplete={handleAssessmentComplete}
          onCancel={handleAssessmentCancel}
        />
      )}
    </Container>
  );
};

export default SpeechAnalysisExample;

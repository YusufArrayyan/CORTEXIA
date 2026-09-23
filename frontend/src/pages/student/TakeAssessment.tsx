import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper
} from '@mui/material';
import {
  RemoveRedEye as GazeIcon,
  Mic as SpeechIcon,
  CheckCircle as CompleteIcon
} from '@mui/icons-material';

const TakeAssessment: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    'Persiapan',
    'Kalibrasi Mata',
    'Latihan Membaca',
    'Selesai'
  ];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Siap Memulai Latihan?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Pastikan kamu berada di tempat yang tenang dan terang
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, textAlign: 'left', maxWidth: 500, mx: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                ✅ Checklist Persiapan:
              </Typography>
              <ul>
                <li>Duduk dengan nyaman di depan layar</li>
                <li>Pastikan wajahmu terlihat di kamera</li>
                <li>Ruangan cukup terang</li>
                <li>Tidak ada gangguan suara</li>
              </ul>
            </Paper>

            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
            >
              Mulai Sekarang
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <GazeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Kalibrasi Pelacakan Mata
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Ikuti titik-titik yang muncul di layar dengan matamu
            </Typography>

            <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Ini akan membantu sistem memahami cara kamu membaca
            </Alert>

            {/* Placeholder for GazeCalibration component */}
            <Box
              sx={{
                width: 400,
                height: 300,
                mx: 'auto',
                mb: 3,
                backgroundColor: 'grey.100',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography color="text.secondary">
                [Area Kalibrasi Mata]
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
            >
              Kalibrasi Selesai
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <SpeechIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Baca Teks Berikut
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Baca dengan suara yang jelas dan tidak terburu-buru
              </Typography>
            </Box>

            {/* Placeholder for reading material */}
            <Paper sx={{ p: 4, mb: 3, maxWidth: 700, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom align="center">
                Kura-kura dan Kelinci
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 2, fontSize: '1.1rem' }}>
                Pada suatu hari, seekor kura-kura dan kelinci bertemu di hutan. 
                Kelinci yang sombong menantang kura-kura untuk lomba lari. 
                Kura-kura menerima tantangan itu dengan senang hati. 
                Saat perlombaan dimulai, kelinci berlari sangat cepat dan meninggalkan kura-kura jauh di belakang.
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
              >
                Ulangi
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
              >
                Selesai Membaca
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CompleteIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Latihan Selesai! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Kamu sudah menyelesaikan latihan hari ini dengan baik
            </Typography>

            <Paper sx={{ p: 3, mb: 3, maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                📊 Ringkasan Sesi:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Durasi Membaca:</Typography>
                  <Typography variant="body2" fontWeight="bold">3 menit 24 detik</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Kata Terbaca:</Typography>
                  <Typography variant="body2" fontWeight="bold">68 kata</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Status:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    Bagus Sekali!
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Alert severity="success" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Gurumu akan melihat hasilnya dan memberikan feedback
            </Alert>

            <Button
              variant="contained"
              size="large"
              href="/student/dashboard"
            >
              Kembali ke Dashboard
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sesi Latihan Membaca
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TakeAssessment;

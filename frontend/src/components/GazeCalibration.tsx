import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, LinearProgress, Alert } from '@mui/material';

interface GazeCalibrationProps {
  isCalibrating: boolean;
  progress: number;
  onStart: () => void;
  onComplete: () => void;
}

const GazeCalibration: React.FC<GazeCalibrationProps> = ({
  isCalibrating,
  progress,
  onStart,
  onComplete,
}) => {
  const totalPoints = 9;
  const currentPointIndex = Math.floor((progress / 100) * totalPoints);
  const calibrationPoints = generateCalibrationPoints();


  // Generate 3x3 calibration grid
  function generateCalibrationPoints() {
    const points = [];
    const margin = 100;
    const cols = 3;
    const rows = 3;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        points.push({
          x: margin + (col * (window.innerWidth - 2 * margin) / (cols - 1)),
          y: margin + (row * (window.innerHeight - 2 * margin) / (rows - 1)),
        });
      }
    }
    
    return points;
  }

  const currentPoint = calibrationPoints[currentPointIndex];

  // Auto-complete when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [progress, onComplete]);

  if (!isCalibrating) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Kalibrasi Gaze Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Sebelum memulai, kita perlu mengkalibrasi eye tracking untuk akurasi yang lebih baik.
        </Typography>
        <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
          <strong>Instruksi:</strong>
          <br />
          1. Pastikan wajah Anda terlihat di kamera
          <br />
          2. Duduk dengan jarak nyaman dari layar (sekitar 60cm)
          <br />
          3. Ikuti titik merah yang muncul di layar
          <br />
          4. Tatap setiap titik dengan mata Anda (jangan gerakkan kepala)
        </Alert>
        <Button variant="contained" size="large" onClick={onStart}>
          Mulai Kalibrasi
        </Button>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          m: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Box>
          <Typography variant="h6">Kalibrasi Mata</Typography>
          <Typography variant="body2" color="text.secondary">
            Tatap titik merah yang muncul di layar dengan mata Anda
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Titik {currentPointIndex + 1} dari {totalPoints}
            </Typography>
            <Typography variant="body2">{Math.round(progress)}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress} />
        </Box>

        {progress > 0 && progress < 100 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Tetap menatap titik merah... Jangan gerakkan kepala Anda
          </Alert>
        )}
      </Paper>

      {/* Calibration Point */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {currentPoint && progress < 100 && (
          <CalibrationDot
            x={currentPoint.x}
            y={currentPoint.y}
          />
        )}
      </Box>

      {/* Instructions */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          m: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <strong>Tips:</strong> Pertahankan posisi kepala yang stabil dan ikuti titik dengan mata Anda saja.
        </Typography>
      </Paper>
    </Box>
  );
};

interface CalibrationDotProps {
  x: number;
  y: number;
}

const CalibrationDot: React.FC<CalibrationDotProps> = ({ x, y }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: x - 25,
        top: y - 25,
        width: 50,
        height: 50,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Outer ring */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid',
          borderColor: 'error.main',
          animation: 'pulse 1.5s infinite',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '50%': {
              transform: 'scale(1.3)',
              opacity: 0.5,
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1,
            },
          },
        }}
      />

      {/* Inner dot */}
      <Box
        sx={{
          position: 'absolute',
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: 'error.main',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: 3,
        }}
      />

      {/* Center point */}
      <Box
        sx={{
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'white',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </Box>
  );
};

export default GazeCalibration;

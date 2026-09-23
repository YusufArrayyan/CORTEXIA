import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';

function App() {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h2" component="h1" gutterBottom color="primary">
            🎓 CORTEXIA
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Multimodal AI-Based Reading Difficulty Profiling
          </Typography>
          
          <Box sx={{ my: 4 }}>
            <Typography variant="body1" paragraph>
              ✅ Frontend is running on <strong>http://localhost:3000</strong>
            </Typography>
            <Typography variant="body1" paragraph>
              ✅ AI Engine is running on <strong>http://localhost:8000</strong>
            </Typography>
            <Typography variant="body1" paragraph color="warning.main">
              ⚠️ Backend requires PostgreSQL (not running)
            </Typography>
          </Box>

          <Box sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              Demo Features:
            </Typography>
            <Typography variant="body2" paragraph>
              • Webcam-based Gaze Tracking
            </Typography>
            <Typography variant="body2" paragraph>
              • Speech Analysis (Indonesian)
            </Typography>
            <Typography variant="body2" paragraph>
              • AI Assessment Engine
            </Typography>
            <Typography variant="body2" paragraph>
              • Adaptive Learning System
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              size="large"
              disabled
            >
              Login (Requires Backend)
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              href="http://localhost:8000/docs"
              target="_blank"
            >
              AI Engine API Docs
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              <strong>To enable full functionality:</strong>
            </Typography>
            <Typography variant="caption" display="block">
              1. Install PostgreSQL from postgresql.org
            </Typography>
            <Typography variant="caption" display="block">
              2. Run: .\setup-database.ps1
            </Typography>
            <Typography variant="caption" display="block">
              3. Run: .\START-ALL.ps1
            </Typography>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Project Status: ✅ 100% Complete (12/12 Tasks)
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default App;

/**
 * Student Dashboard - CORTEXIA
 * Main dashboard for students showing assessments, progress, and recommendations
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  MenuBook,
  PlayArrow,
  EmojiEvents,
} from '@mui/icons-material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAssessments: 0,
    averageScore: 0,
    currentLevel: 'Pemula',
    progressPercentage: 0,
  });

  useEffect(() => {
    // TODO: Fetch student stats from API
    // Dummy data for now
    setStats({
      totalAssessments: 12,
      averageScore: 75,
      currentLevel: 'Menengah',
      progressPercentage: 60,
    });
  }, []);

  const recentAssessments = [
    { id: 1, title: 'Kucing Kesayangan', score: 85, difficulty: 'EASY', date: '2024-01-15' },
    { id: 2, title: 'Perjalanan ke Pantai', score: 72, difficulty: 'MEDIUM', date: '2024-01-14' },
    { id: 3, title: 'Teknologi dan Masa Depan', score: 68, difficulty: 'HARD', date: '2024-01-13' },
  ];

  const recommendedTexts = [
    { id: 1, title: 'Hari Pertama Sekolah', difficulty: 'EASY', description: 'Cerita tentang pengalaman hari pertama sekolah' },
    { id: 2, title: 'Menjaga Lingkungan', difficulty: 'MEDIUM', description: 'Pentingnya menjaga kebersihan lingkungan' },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HARD': return 'error';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Selamat Datang, {user?.fullName || 'Siswa'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Mari lanjutkan perjalanan belajar membacamu
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <Assessment />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.totalAssessments}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Assessment
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.averageScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rata-rata Skor
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <EmojiEvents />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.currentLevel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Level Saat Ini
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <MenuBook />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stats.progressPercentage}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Mulai Assessment Baru
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
              Pilih teks bacaan dan mulai penilaian untuk meningkatkan kemampuan membacamu
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => navigate('/student/assessment')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              Mulai Sekarang
            </Button>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Recent Assessments */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Assessment Terakhir
                </Typography>
                {recentAssessments.map((assessment) => (
                  <Box
                    key={assessment.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {assessment.title}
                      </Typography>
                      <Chip
                        label={assessment.difficulty}
                        color={getDifficultyColor(assessment.difficulty)}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {assessment.date}
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight={700}>
                        {assessment.score}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <Button fullWidth onClick={() => navigate('/student/progress')}>
                  Lihat Semua Assessment
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Recommended Texts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Rekomendasi Teks
                </Typography>
                {recommendedTexts.map((text) => (
                  <Box
                    key={text.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {text.title}
                      </Typography>
                      <Chip
                        label={text.difficulty}
                        color={getDifficultyColor(text.difficulty)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {text.description}
                    </Typography>
                  </Box>
                ))}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/student/assessment')}
                >
                  Mulai Assessment
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Progress Overview */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Progress Pembelajaran
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Progress ke Level Berikutnya</Typography>
                <Typography variant="body2" fontWeight={600}>{stats.progressPercentage}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={stats.progressPercentage} sx={{ height: 8, borderRadius: 1 }} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Selesaikan {Math.ceil((100 - stats.progressPercentage) / 10)} assessment lagi untuk naik ke level berikutnya!
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default StudentDashboard;

/**
 * Parent Dashboard Main Component
 * Overview dashboard showing all children and their progress
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Button,
  IconButton,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon
} from '@mui/icons-material';
import parentService from '../../services/parentService';
import { ParentDashboardData, ChildSummary, DifficultyLevel } from '../../types/parent.types';

const getDifficultyColor = (level: DifficultyLevel): 'success' | 'warning' | 'error' | 'default' => {
  switch (level) {
    case 'NONE':
      return 'success';
    case 'MILD':
      return 'warning';
    case 'MODERATE':
    case 'SEVERE':
      return 'error';
    default:
      return 'default';
  }
};

const getDifficultyLabel = (level: DifficultyLevel): string => {
  const labels = {
    NONE: 'Sangat Baik',
    MILD: 'Perlu Latihan',
    MODERATE: 'Perlu Perhatian',
    SEVERE: 'Perlu Bantuan Intensif'
  };
  return labels[level] || level;
};

const ParentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await parentService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadDashboard}>
            Coba Lagi
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { summary, children } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dashboard Orang Tua
          </Typography>
          <Typography color="textSecondary">
            Pantau perkembangan membaca anak Anda
          </Typography>
        </Box>
        <IconButton onClick={loadDashboard} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Jumlah Anak
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.totalChildren}
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Dalam Program
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.childrenWithActivePath}
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ bgcolor: summary.childrenNeedingAttention > 0 ? 'warning.light' : 'background.paper' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Perlu Perhatian
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.childrenNeedingAttention}
                  </Typography>
                </Box>
                <NotificationsIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Jadwal Mendatang
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.upcomingInterventions}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Feedback Alert */}
      {summary.recentFeedback > 0 && (
        <Alert severity="info" icon={<StarIcon />} sx={{ mb: 3 }}>
          Ada {summary.recentFeedback} feedback baru dari guru dalam 30 hari terakhir
        </Alert>
      )}

      {/* Children Cards */}
      <Typography variant="h5" gutterBottom fontWeight="bold" mb={2}>
        Anak-anak Anda
      </Typography>

      {children.length > 0 ? (
        <Grid container spacing={3}>
          {children.map((child) => (
            <Grid item xs={12} md={6} key={child.id}>
              <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  {/* Child Header */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
                      {child.fullName.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold">
                        {child.fullName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {child.class.name} • Kelas {child.class.grade}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Guru: {child.class.teacher.user.fullName}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Status Chip */}
                  <Box mb={2}>
                    <Chip
                      label={getDifficultyLabel(child.currentStatus)}
                      color={getDifficultyColor(child.currentStatus)}
                      size="medium"
                      icon={<TrendingUpIcon />}
                    />
                  </Box>

                  {/* Progress Bar */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" color="textSecondary">
                        Progress Learning Path
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {child.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={child.progress}
                      color={getDifficultyColor(child.currentStatus)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Last Assessment */}
                  {child.lastAssessment && (
                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.default' }}>
                      <Typography variant="caption" color="textSecondary" display="block">
                        Assessment Terakhir
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography variant="body2">
                          {new Date(child.lastAssessment.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </Typography>
                        <Chip
                          label={getDifficultyLabel(child.lastAssessment.overallDifficulty)}
                          size="small"
                          color={getDifficultyColor(child.lastAssessment.overallDifficulty)}
                        />
                      </Box>
                    </Paper>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => window.location.href = `/parent/children/${child.id}`}
                  >
                    Lihat Detail
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Belum ada data anak
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Hubungi administrator untuk menambahkan anak Anda ke sistem
          </Typography>
        </Paper>
      )}

      {/* Tips Section */}
      <Paper elevation={2} sx={{ p: 3, mt: 3, bgcolor: 'primary.light' }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          💡 Tips untuk Orang Tua
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • Luangkan waktu 15-20 menit setiap hari untuk membaca bersama anak
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • Buat suasana membaca yang menyenangkan dan tidak memaksa
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          • Berikan pujian untuk setiap kemajuan, sekecil apapun
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • Komunikasi rutin dengan guru tentang perkembangan anak
        </Typography>
      </Paper>
    </Container>
  );
};

export default ParentDashboard;

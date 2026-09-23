/**
 * Teacher Dashboard Main Component
 * Overview dashboard with key metrics and quick access
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import teacherService from '../../services/teacherService';
import { DashboardData, DifficultyLevel } from '../../types/teacher.types';

const DIFFICULTY_COLORS = {
  [DifficultyLevel.NONE]: '#4caf50',
  [DifficultyLevel.MILD]: '#ffc107',
  [DifficultyLevel.MODERATE]: '#ff9800',
  [DifficultyLevel.SEVERE]: '#f44336'
};

const TeacherDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
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
            Retry
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

  const { summary, classes, difficultyDistribution } = dashboardData;

  // Prepare chart data
  const chartData = Object.entries(difficultyDistribution).map(([level, count]) => ({
    name: level,
    value: count,
    color: DIFFICULTY_COLORS[level as DifficultyLevel]
  }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Dashboard Guru
        </Typography>
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
                    Total Kelas
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.totalClasses}
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.7 }} />
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
                    Total Siswa
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.totalStudents}
                  </Typography>
                </Box>
                <GroupIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.7 }} />
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
                    Assessment (7 hari)
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.recentAssessments}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ bgcolor: summary.studentsNeedingIntervention > 0 ? 'warning.light' : 'background.paper' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Perlu Intervensi
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" mt={1}>
                    {summary.studentsNeedingIntervention}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Difficulty Distribution Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Distribusi Tingkat Kesulitan
            </Typography>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <Typography color="textSecondary">
                  Belum ada data assessment
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Classes List */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Kelas Saya
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => window.location.href = '/teacher/classes'}
              >
                Lihat Semua
              </Button>
            </Box>
            {classes.length > 0 ? (
              <List>
                {classes.map((classItem) => (
                  <ListItem
                    key={classItem.id}
                    secondaryAction={
                      <Chip
                        label={`${classItem.studentCount} siswa`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    }
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => window.location.href = `/teacher/classes/${classItem.id}`}
                  >
                    <ListItemText
                      primary={classItem.name}
                      secondary={`Kelas ${classItem.grade}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <Typography color="textSecondary">
                  Belum ada kelas
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Pending Interventions */}
        {summary.pendingInterventions > 0 && (
          <Grid item xs={12}>
            <Alert
              severity="info"
              icon={<TrendingUpIcon />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => window.location.href = '/teacher/interventions'}
                >
                  Lihat
                </Button>
              }
            >
              Ada {summary.pendingInterventions} intervensi yang perlu dilakukan
            </Alert>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;

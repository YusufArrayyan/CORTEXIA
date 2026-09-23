/**
 * Child Detail View Component (Parent)
 * Comprehensive view of child's progress, assessments, and recommendations
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  LinearProgress,
  Divider,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  EmojiEvents as TrophyIcon,
  Feedback as FeedbackIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import parentService from '../../services/parentService';
import {
  ChildDetails,
  ChildProgress,
  HomePracticeRecommendations,
  MilestonesData,
  DifficultyLevel
} from '../../types/parent.types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

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

const ChildDetailView: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [child, setChild] = useState<ChildDetails | null>(null);
  const [progress, setProgress] = useState<ChildProgress | null>(null);
  const [homePractice, setHomePractice] = useState<HomePracticeRecommendations | null>(null);
  const [milestones, setMilestones] = useState<MilestonesData | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadChildData();
  }, [childId]);

  const loadChildData = async () => {
    if (!childId) return;

    try {
      setLoading(true);
      setError(null);

      const [childDetails, childProgress, practice, milestonesData] = await Promise.all([
        parentService.getChildDetails(parseInt(childId)),
        parentService.getChildProgress(parseInt(childId), 90),
        parentService.getHomePractice(parseInt(childId)),
        parentService.getChildMilestones(parseInt(childId))
      ]);

      setChild(childDetails);
      setProgress(childProgress);
      setHomePractice(practice);
      setMilestones(milestonesData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat data anak');
      console.error('Child details error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !child) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Data anak tidak ditemukan'}</Alert>
      </Container>
    );
  }

  const activePath = child.learningPaths[0];
  const analytics = child.analytics;

  // Prepare chart data
  const chartData = progress ? {
    labels: progress.timeline.map(t => new Date(t.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Tingkat Kesulitan',
        data: progress.timeline.map(t => {
          const diffMap = { NONE: 4, MILD: 3, MODERATE: 2, SEVERE: 1 };
          return diffMap[t.difficulty as keyof typeof diffMap] || 2;
        }),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  } : null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => window.history.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {child.user.fullName}
          </Typography>
          <Typography color="textSecondary">
            {child.class.name} • Guru: {child.class.teacher.user.fullName}
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Status Saat Ini
              </Typography>
              <Box mt={1}>
                <Chip
                  label={activePath?.difficultyLevel || 'NONE'}
                  color={getDifficultyColor(activePath?.difficultyLevel || 'NONE')}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Progress
              </Typography>
              <Typography variant="h5" fontWeight="bold" mt={1}>
                {activePath?.currentProgress || 0}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={activePath?.currentProgress || 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Tren
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon
                  color={progress?.overallTrend === 'improving' ? 'success' : 'warning'}
                  sx={{ mr: 1 }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {progress?.overallTrend === 'improving' ? 'Membaik' : 
                   progress?.overallTrend === 'declining' ? 'Menurun' : 'Stabil'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Progress" icon={<TrendingUpIcon />} />
          <Tab label="Latihan di Rumah" icon={<HomeIcon />} />
          <Tab label="Pencapaian" icon={<TrophyIcon />} />
          <Tab label="Feedback Guru" icon={<FeedbackIcon />} />
        </Tabs>

        {/* Progress Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box p={2}>
            {/* Progress Chart */}
            {chartData && (
              <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Perkembangan 90 Hari Terakhir
                </Typography>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        min: 0,
                        max: 4,
                        ticks: {
                          callback: (value) => {
                            const labels = ['', 'Berat', 'Sedang', 'Ringan', 'Baik'];
                            return labels[value as number] || '';
                          }
                        }
                      }
                    }
                  }}
                />
              </Paper>
            )}

            {/* Skill Progress */}
            {analytics && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Progress per Keterampilan
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(analytics.skillProgress).map(([skillName, skillData]) => (
                    <Grid item xs={12} sm={6} key={skillName}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">{skillName}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {skillData.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={skillData.progress}
                          color={skillData.trend === 'improving' ? 'success' : 'warning'}
                        />
                        <Typography variant="caption" color="textSecondary">
                          Saat ini: {(skillData.currentLevel * 100).toFixed(0)}% • Target: {(skillData.targetLevel * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Home Practice Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box p={2}>
            {homePractice && (
              <>
                {/* Daily Activities */}
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Aktivitas Harian
                  </Typography>
                  <List>
                    {homePractice.daily.map((activity, index) => (
                      <ListItem key={index} divider={index < homePractice.daily.length - 1}>
                        <ListItemText
                          primary={activity.activity}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                Durasi: {activity.duration}
                              </Typography>
                              <br />
                              💡 {activity.tips}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>

                {/* Weekly Goals */}
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    Target Mingguan
                  </Typography>
                  {homePractice.weekly.map((goal, index) => (
                    <Box key={index} mb={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {goal.skill}: {goal.goal}
                      </Typography>
                      <List dense>
                        {goal.activities.map((activity, actIndex) => (
                          <ListItem key={actIndex}>
                            <Typography variant="body2">• {activity}</Typography>
                          </ListItem>
                        ))}
                      </List>
                      {index < homePractice.weekly.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Paper>

                {/* Practice Words */}
                {homePractice.practiceWords.length > 0 && (
                  <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Kata-kata untuk Dilatih
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {homePractice.practiceWords.map((word, index) => (
                        <Chip key={index} label={word} variant="outlined" />
                      ))}
                    </Box>
                  </Paper>
                )}

                {/* Tips */}
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    💡 Tips untuk Orang Tua
                  </Typography>
                  {homePractice.tips.map((tip, index) => (
                    <Typography key={index} variant="body2" paragraph>
                      • {tip}
                    </Typography>
                  ))}
                </Paper>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Achievements Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box p={2}>
            {milestones && (
              <>
                {/* Achievements */}
                {milestones.achievements.length > 0 && (
                  <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      🏆 Pencapaian
                    </Typography>
                    <Grid container spacing={2}>
                      {milestones.achievements.map((achievement, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h2">{achievement.icon}</Typography>
                              <Typography variant="h6" gutterBottom>
                                {achievement.title}
                              </Typography>
                              {achievement.description && (
                                <Typography variant="body2" color="textSecondary">
                                  {achievement.description}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                )}

                {/* Milestones */}
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    ⭐ Milestone
                  </Typography>
                  <List>
                    {milestones.milestones.map((milestone, index) => (
                      <ListItem
                        key={index}
                        divider={index < milestones.milestones.length - 1}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="body1">
                                {milestone.achieved ? '✅' : '⏳'} {milestone.description}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              {new Date(milestone.date).toLocaleDateString('id-ID')}
                              {milestone.skillName && ` • ${milestone.skillName}`}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Feedback Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box p={2}>
            {child.feedback.length > 0 ? (
              <List>
                {child.feedback.map((feedback) => (
                  <Paper key={feedback.id} elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {feedback.teacher.user.fullName}
                      </Typography>
                      <Chip label={feedback.type} size="small" />
                    </Box>
                    <Typography variant="body2" paragraph>
                      {feedback.content}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(feedback.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Paper>
                ))}
              </List>
            ) : (
              <Alert severity="info">Belum ada feedback dari guru</Alert>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ChildDetailView;

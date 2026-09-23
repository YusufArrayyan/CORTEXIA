/**
 * Student Detail View Component
 * Comprehensive student profile with assessment history, learning path, and interventions
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
  Button,
  IconButton,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import teacherService from '../../services/teacherService';
import {
  StudentDetails,
  DifficultyLevel,
  InterventionType,
  InterventionStatus,
  FeedbackType,
  CreateInterventionRequest,
  CreateFeedbackRequest
} from '../../types/teacher.types';

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
    case DifficultyLevel.NONE:
      return 'success';
    case DifficultyLevel.MILD:
      return 'warning';
    case DifficultyLevel.MODERATE:
    case DifficultyLevel.SEVERE:
      return 'error';
    default:
      return 'default';
  }
};

const StudentDetailView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  
  // Form states
  const [interventionForm, setInterventionForm] = useState<Partial<CreateInterventionRequest>>({
    type: InterventionType.TARGETED_PRACTICE,
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    duration: 30
  });
  
  const [feedbackForm, setFeedbackForm] = useState<Partial<CreateFeedbackRequest>>({
    type: FeedbackType.NOTE,
    content: '',
    isPrivate: false
  });

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await teacherService.getStudentDetails(parseInt(studentId));
      setStudent(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load student data');
      console.error('Student details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleIntervention = async () => {
    if (!student || !student.learningPaths[0]) return;

    try {
      const moduleId = student.learningPaths[0].modules[0]?.id;
      if (!moduleId) {
        alert('No learning module found');
        return;
      }

      await teacherService.scheduleIntervention({
        ...interventionForm,
        learningModuleId: moduleId
      } as CreateInterventionRequest);

      setInterventionDialogOpen(false);
      loadStudentData();
      alert('Intervention scheduled successfully');
    } catch (err: any) {
      console.error('Schedule intervention error:', err);
      alert(err.response?.data?.message || 'Failed to schedule intervention');
    }
  };

  const handleAddFeedback = async () => {
    if (!studentId) return;

    try {
      await teacherService.addFeedback({
        ...feedbackForm,
        studentId: parseInt(studentId)
      } as CreateFeedbackRequest);

      setFeedbackDialogOpen(false);
      loadStudentData();
      alert('Feedback added successfully');
    } catch (err: any) {
      console.error('Add feedback error:', err);
      alert(err.response?.data?.message || 'Failed to add feedback');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !student) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Student not found'}</Alert>
      </Container>
    );
  }

  const activePath = student.learningPaths[0];
  const analytics = student.analytics;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => window.history.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {student.user.fullName}
          </Typography>
          <Typography color="textSecondary">
            {student.class.name} • Kelas {student.class.grade}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFeedbackDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          Tambah Feedback
        </Button>
        <Button
          variant="outlined"
          startIcon={<EventIcon />}
          onClick={() => setInterventionDialogOpen(true)}
        >
          Jadwalkan Intervensi
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Status Kesulitan
              </Typography>
              <Box mt={1}>
                <Chip
                  label={activePath?.difficultyLevel || 'NONE'}
                  color={getDifficultyColor(activePath?.difficultyLevel || DifficultyLevel.NONE)}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Progress Learning Path
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

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Total Assessment
              </Typography>
              <Typography variant="h5" fontWeight="bold" mt={1}>
                {student.assessments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2">
                Trend
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon
                  color={analytics?.progressTrend === 'improving' ? 'success' : 'warning'}
                  sx={{ mr: 1 }}
                />
                <Typography variant="h6" fontWeight="bold">
                  {analytics?.progressTrend || 'stable'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Assessment History" />
          <Tab label="Learning Path" />
          <Tab label="Interventions" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box p={2}>
            <Grid container spacing={3}>
              {/* Analytics */}
              {analytics && (
                <>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Progress per Skill
                      </Typography>
                      {Object.entries(analytics.skillProgress).map(([skillName, progress]) => (
                        <Box key={skillName} mb={2}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{skillName}</Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {progress.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress.progress}
                            color={progress.trend === 'improving' ? 'success' : 'warning'}
                          />
                          <Typography variant="caption" color="textSecondary">
                            Current: {progress.currentLevel} • Target: {progress.targetLevel}
                          </Typography>
                        </Box>
                      ))}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Strengths & Weaknesses
                      </Typography>
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                          Strengths:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {analytics.strengths.map((strength, index) => (
                            <Chip key={index} label={strength} size="small" color="success" />
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="error.main" gutterBottom>
                          Weaknesses:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {analytics.weaknesses.map((weakness, index) => (
                            <Chip key={index} label={weakness} size="small" color="error" />
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom fontWeight="bold">
                        Milestones
                      </Typography>
                      <Timeline>
                        {analytics.milestones.slice(0, 5).map((milestone, index) => (
                          <TimelineItem key={index}>
                            <TimelineSeparator>
                              <TimelineDot color={milestone.achieved ? 'success' : 'grey'} />
                              {index < Math.min(analytics.milestones.length, 5) - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent>
                              <Typography variant="body2">
                                {milestone.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(milestone.date).toLocaleDateString('id-ID')}
                                {milestone.skillName && ` • ${milestone.skillName}`}
                              </Typography>
                            </TimelineContent>
                          </TimelineItem>
                        ))}
                      </Timeline>
                    </Paper>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </TabPanel>

        {/* Assessment History Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box p={2}>
            <List>
              {student.assessments.slice(0, 10).map((assessment) => (
                <ListItem
                  key={assessment.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => window.location.href = `/teacher/assessments/${assessment.id}`}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <AssessmentIcon sx={{ mr: 1 }} />
                        Assessment #{assessment.id}
                        <Chip
                          label={assessment.overallDifficulty}
                          color={getDifficultyColor(assessment.overallDifficulty)}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    }
                    secondary={new Date(assessment.createdAt).toLocaleString('id-ID')}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </TabPanel>

        {/* Learning Path Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box p={2}>
            {activePath ? (
              <Grid container spacing={2}>
                {activePath.modules.map((module) => (
                  <Grid item xs={12} md={6} key={module.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {module.skillName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Status: {module.status}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={module.currentScore ? module.currentScore * 100 : 0}
                          sx={{ my: 1 }}
                        />
                        <Typography variant="caption" display="block" gutterBottom>
                          Target Level: {module.targetLevel}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                          Objectives:
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          {module.objectives.slice(0, 3).map((obj, i) => (
                            <li key={i}>
                              <Typography variant="caption">{obj}</Typography>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">Belum ada learning path aktif</Alert>
            )}
          </Box>
        </TabPanel>

        {/* Interventions Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box p={2}>
            {activePath && activePath.modules.some(m => m.interventions.length > 0) ? (
              <List>
                {activePath.modules.flatMap(module =>
                  module.interventions.map(intervention => (
                    <ListItem
                      key={intervention.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            {intervention.type.replace('_', ' ')}
                            <Chip
                              label={intervention.status}
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            {intervention.description}
                            <br />
                            Scheduled: {new Date(intervention.scheduledDate).toLocaleDateString('id-ID')}
                            {intervention.duration && ` • ${intervention.duration} minutes`}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            ) : (
              <Alert severity="info">Belum ada intervensi terjadwal</Alert>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Schedule Intervention Dialog */}
      <Dialog open={interventionDialogOpen} onClose={() => setInterventionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Jadwalkan Intervensi</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipe Intervensi</InputLabel>
              <Select
                value={interventionForm.type}
                onChange={(e) => setInterventionForm({ ...interventionForm, type: e.target.value as InterventionType })}
              >
                {Object.values(InterventionType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Deskripsi"
              multiline
              rows={3}
              value={interventionForm.description}
              onChange={(e) => setInterventionForm({ ...interventionForm, description: e.target.value })}
              fullWidth
            />
            <TextField
              label="Tanggal"
              type="date"
              value={interventionForm.scheduledDate}
              onChange={(e) => setInterventionForm({ ...interventionForm, scheduledDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Durasi (menit)"
              type="number"
              value={interventionForm.duration}
              onChange={(e) => setInterventionForm({ ...interventionForm, duration: parseInt(e.target.value) })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterventionDialogOpen(false)}>Batal</Button>
          <Button onClick={handleScheduleIntervention} variant="contained">Jadwalkan</Button>
        </DialogActions>
      </Dialog>

      {/* Add Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipe Feedback</InputLabel>
              <Select
                value={feedbackForm.type}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value as FeedbackType })}
              >
                {Object.values(FeedbackType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Konten"
              multiline
              rows={4}
              value={feedbackForm.content}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Privasi</InputLabel>
              <Select
                value={feedbackForm.isPrivate ? 'private' : 'public'}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, isPrivate: e.target.value === 'private' })}
              >
                <MenuItem value="public">Publik (Terlihat siswa & orang tua)</MenuItem>
                <MenuItem value="private">Privat (Hanya guru)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Batal</Button>
          <Button onClick={handleAddFeedback} variant="contained">Simpan</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentDetailView;

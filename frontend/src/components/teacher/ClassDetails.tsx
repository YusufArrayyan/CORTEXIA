/**
 * Class Details Component
 * Detailed view of a specific class with student list and analytics
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import teacherService from '../../services/teacherService';
import {
  ClassDetails as ClassDetailsType,
  StudentInClass,
  DifficultyLevel,
  ClassAnalytics
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

const ClassDetails: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classData, setClassData] = useState<ClassDetailsType | null>(null);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      setError(null);
      
      const [classDetails, classAnalytics] = await Promise.all([
        teacherService.getClassDetails(parseInt(classId)),
        teacherService.getClassAnalytics(parseInt(classId), 30)
      ]);
      
      setClassData(classDetails);
      setAnalytics(classAnalytics);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load class data');
      console.error('Class details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!classId) return;
    
    try {
      const report = await teacherService.exportClassReport(parseInt(classId), 'json');
      
      // Download as JSON
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `class-report-${classId}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !classData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Class not found'}</Alert>
      </Container>
    );
  }

  const filteredStudents = classData.students.filter((student) =>
    student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => window.history.back()} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {classData.name}
          </Typography>
          <Typography color="textSecondary">
            Kelas {classData.grade} • Tahun Ajaran {classData.academicYear}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportReport}
        >
          Export Laporan
        </Button>
      </Box>

      {/* Tabs */}
      <Paper elevation={2}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Daftar Siswa" />
          <Tab label="Analitik Kelas" />
        </Tabs>

        {/* Students Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box p={2}>
            <TextField
              fullWidth
              placeholder="Cari siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama Siswa</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Progress</TableCell>
                    <TableCell align="center">Assessment Terakhir</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const activePath = student.learningPaths[0];
                      const lastAssessment = student.assessments[0];

                      return (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              {student.user.fullName}
                            </Box>
                          </TableCell>
                          <TableCell>{student.user.email}</TableCell>
                          <TableCell align="center">
                            {activePath ? (
                              <Chip
                                label={activePath.difficultyLevel}
                                color={getDifficultyColor(activePath.difficultyLevel)}
                                size="small"
                              />
                            ) : (
                              <Chip label="No Path" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {activePath ? (
                              <Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={activePath.currentProgress}
                                  sx={{ mb: 0.5 }}
                                />
                                <Typography variant="caption">
                                  {activePath.currentProgress}%
                                </Typography>
                              </Box>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {lastAssessment ? (
                              <Typography variant="body2">
                                {new Date(lastAssessment.createdAt).toLocaleDateString('id-ID')}
                              </Typography>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.location.href = `/teacher/students/${student.userId}`}
                            >
                              Detail
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          {searchQuery ? 'Tidak ada siswa yang ditemukan' : 'Belum ada siswa di kelas ini'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={1}>
          {analytics ? (
            <Box p={2}>
              <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="body2">
                        Total Siswa
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {analytics.studentCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="body2">
                        Total Assessment
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {analytics.assessmentCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="body2">
                        Rata-rata Performa
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {(analytics.averagePerformance * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="body2">
                        Learning Paths Aktif
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {Object.values(analytics.activePaths).reduce((sum, count) => sum + count, 0)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Skill Averages */}
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Rata-rata Skor per Skill
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(analytics.skillAverages).map(([skill, data]) => (
                        <Grid item xs={12} sm={6} md={3} key={skill}>
                          <Box>
                            <Typography variant="subtitle2" color="textSecondary">
                              {skill}
                            </Typography>
                            <Typography variant="h6">
                              {(data.score * 100).toFixed(1)}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={data.score * 100}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Grid>

                {/* Difficulty Distribution */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Distribusi Tingkat Kesulitan
                    </Typography>
                    {Object.entries(analytics.difficultyDistribution).map(([level, count]) => (
                      <Box key={level} mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2">{level}</Typography>
                          <Typography variant="body2" fontWeight="bold">{count}</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(count / analytics.studentCount) * 100}
                          color={getDifficultyColor(level as DifficultyLevel)}
                        />
                      </Box>
                    ))}
                  </Paper>
                </Grid>

                {/* Intervention Statistics */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Statistik Intervensi
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Tipe</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Jumlah</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {analytics.interventionStats.map((stat, index) => (
                            <TableRow key={index}>
                              <TableCell>{stat.type.replace('_', ' ')}</TableCell>
                              <TableCell>
                                <Chip label={stat.status} size="small" />
                              </TableCell>
                              <TableCell align="right">{stat.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ClassDetails;

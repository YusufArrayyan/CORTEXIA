import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Card, CardContent, Grid, Box, Chip, 
  LinearProgress, Alert, CircularProgress, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { TrendingUp, Assessment, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';

interface AssessmentRecord {
  id: number;
  text_id: number;
  assessed_at: string;
  difficulty_level: string;
  comprehension_score: number;
  fluency_score: number;
  reading_speed: number;
  duration_seconds: number;
  confidence_score: number;
  recommendations: string[];
  reading_texts: {
    title: string;
    difficulty_level: string;
  };
}

interface ProgressStats {
  total_assessments: number;
  average_score: number;
  last_assessment_date: string;
}

const StudentProgress: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assessments
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          id,
          text_id,
          assessed_at,
          difficulty_level,
          comprehension_score,
          fluency_score,
          reading_speed,
          duration_seconds,
          confidence_score,
          recommendations,
          reading_texts (
            title,
            difficulty_level
          )
        `)
        .eq('user_id', user?.id)
        .order('assessed_at', { ascending: false })
        .limit(20);

      if (assessmentError) throw assessmentError;

      // Fetch progress stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is ok for new users
        throw statsError;
      }

      setAssessments(assessmentData || []);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching progress data:', err);
      setError('Gagal memuat data progress');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HARD':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Memuat data progress...</Typography>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Progress Pembelajaran 📊
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Stats */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Assessment
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {stats.total_assessments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Rata-rata Skor
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="primary">
                    {stats.average_score.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Assessment Terakhir
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(stats.last_assessment_date)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Assessment History */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
          Riwayat Assessment
        </Typography>

        {assessments.length === 0 ? (
          <Alert severity="info">
            Belum ada assessment. Mulai assessment pertama Anda sekarang!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {assessments.map((assessment) => (
              <Grid item xs={12} key={assessment.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                          {assessment.reading_texts?.title || `Text #${assessment.text_id}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(assessment.assessed_at)} • {formatDuration(assessment.duration_seconds)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" color="primary" fontWeight={700}>
                          {assessment.comprehension_score}%
                        </Typography>
                        <Chip 
                          label={assessment.difficulty_level} 
                          color={getDifficultyColor(assessment.difficulty_level) as any}
                          size="small" 
                        />
                      </Box>
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Pemahaman
                        </Typography>
                        <Typography variant="h6">{assessment.comprehension_score}%</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Kelancaran
                        </Typography>
                        <Typography variant="h6">{assessment.fluency_score}%</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Kecepatan
                        </Typography>
                        <Typography variant="h6">{assessment.reading_speed} wpm</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Confidence
                        </Typography>
                        <Typography variant="h6">{(assessment.confidence_score * 100).toFixed(0)}%</Typography>
                      </Grid>
                    </Grid>

                    <LinearProgress 
                      variant="determinate" 
                      value={assessment.comprehension_score} 
                      sx={{ height: 8, borderRadius: 1, mb: 2 }} 
                    />

                    {assessment.recommendations && assessment.recommendations.length > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                          Rekomendasi:
                        </Typography>
                        {assessment.recommendations.map((rec, idx) => (
                          <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <CheckCircle sx={{ fontSize: 16 }} /> {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </DashboardLayout>
  );
};

export default StudentProgress;

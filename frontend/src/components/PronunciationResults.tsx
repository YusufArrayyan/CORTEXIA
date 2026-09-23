import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  PronunciationAssessment,
  ReadingFluencyMetrics,
  ReadingError
} from '../types/speech.types';

interface PronunciationResultsProps {
  pronunciationAssessments: PronunciationAssessment[];
  fluencyMetrics: ReadingFluencyMetrics;
  errors?: ReadingError[];
  expectedText?: string;
  recognizedText?: string;
}

/**
 * PronunciationResults Component
 * 
 * Displays detailed pronunciation assessment results.
 * Shows word-level accuracy, fluency metrics, and error analysis.
 */
const PronunciationResults: React.FC<PronunciationResultsProps> = ({
  pronunciationAssessments,
  fluencyMetrics,
  errors = [],
  expectedText,
  recognizedText
}) => {
  const getAccuracyColor = (accuracy: number): 'success' | 'warning' | 'error' => {
    if (accuracy >= 0.8) return 'success';
    if (accuracy >= 0.5) return 'warning';
    return 'error';
  };

  const getFluentScoreColor = (score: number): string => {
    if (score >= 0.8) return 'success.main';
    if (score >= 0.6) return 'warning.main';
    return 'error.main';
  };

  return (
    <Stack spacing={3}>
      {/* Overall Metrics */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Reading Assessment Results
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Accuracy */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Accuracy
                </Typography>
                <Typography variant="h4" color={getFluentScoreColor(fluencyMetrics.accuracy)}>
                  {(fluencyMetrics.accuracy * 100).toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={fluencyMetrics.accuracy * 100}
                  color={getAccuracyColor(fluencyMetrics.accuracy)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Reading Speed */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reading Speed
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {fluencyMetrics.wordsPerMinute.toFixed(0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  words per minute
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Fluency Score */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Fluency Score
                </Typography>
                <Typography variant="h4" color={getFluentScoreColor(fluencyMetrics.overallFluencyScore)}>
                  {(fluencyMetrics.overallFluencyScore * 100).toFixed(0)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={fluencyMetrics.overallFluencyScore * 100}
                  color={getAccuracyColor(fluencyMetrics.overallFluencyScore)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Errors */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Errors
                </Typography>
                <Typography variant="h4" color="error.main">
                  {fluencyMetrics.incorrectWords}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  out of {fluencyMetrics.totalWords} words
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Detailed Metrics */}
      <Grid container spacing={3}>
        {/* Word Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Word Statistics
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Correct Words:</Typography>
                  <Chip
                    icon={<CheckIcon />}
                    label={fluencyMetrics.correctWords}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Omitted Words:</Typography>
                  <Chip
                    icon={<ErrorIcon />}
                    label={fluencyMetrics.omittedWords}
                    color="error"
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Substituted Words:</Typography>
                  <Chip
                    icon={<WarningIcon />}
                    label={fluencyMetrics.substitutedWords}
                    color="warning"
                    size="small"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Inserted Words:</Typography>
                  <Chip
                    label={fluencyMetrics.insertedWords}
                    size="small"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Prosody Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prosody Analysis
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Speaking Rate:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {fluencyMetrics.prosody.speakingRate.toFixed(0)} WPM
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Pauses:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {fluencyMetrics.prosody.pauseCount}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Avg Pause Duration:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {fluencyMetrics.prosody.averagePauseDuration.toFixed(0)} ms
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Fluency Score:</Typography>
                    <Typography variant="body2" fontWeight="bold" color={getFluentScoreColor(fluencyMetrics.prosody.fluencyScore)}>
                      {(fluencyMetrics.prosody.fluencyScore * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={fluencyMetrics.prosody.fluencyScore * 100}
                    color={getAccuracyColor(fluencyMetrics.prosody.fluencyScore)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Text Comparison */}
      {expectedText && recognizedText && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Text Comparison
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Expected Text:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover' }}>
                <Typography variant="body2">{expectedText}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recognized Text:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.selected' }}>
                <Typography variant="body2">{recognizedText}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Word-Level Assessment */}
      {pronunciationAssessments.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Word-Level Assessment
          </Typography>
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>#</strong></TableCell>
                  <TableCell><strong>Expected</strong></TableCell>
                  <TableCell><strong>Recognized</strong></TableCell>
                  <TableCell><strong>Accuracy</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pronunciationAssessments.slice(0, 50).map((assessment, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: assessment.isCorrect
                        ? 'success.light'
                        : assessment.isOmitted
                        ? 'error.light'
                        : assessment.isMispronounced
                        ? 'warning.light'
                        : 'inherit',
                      opacity: assessment.isCorrect ? 0.3 : 1
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{assessment.expectedWord}</TableCell>
                    <TableCell>
                      {assessment.word || <em style={{ color: 'gray' }}>-</em>}
                    </TableCell>
                    <TableCell>
                      {(assessment.accuracy * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      {assessment.isCorrect && (
                        <Chip icon={<CheckIcon />} label="Correct" color="success" size="small" />
                      )}
                      {assessment.isMispronounced && (
                        <Chip icon={<WarningIcon />} label="Mispronounced" color="warning" size="small" />
                      )}
                      {assessment.isOmitted && (
                        <Chip icon={<ErrorIcon />} label="Omitted" color="error" size="small" />
                      )}
                      {assessment.isInserted && (
                        <Chip label="Inserted" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {pronunciationAssessments.length > 50 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing first 50 of {pronunciationAssessments.length} words
            </Typography>
          )}
        </Paper>
      )}

      {/* Error Summary */}
      {errors.length > 0 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Error Analysis
          </Typography>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {errors.slice(0, 10).map((error, index) => (
              <Box
                key={index}
                sx={{
                  p: 1.5,
                  borderLeft: 4,
                  borderColor: error.severity === 'high' ? 'error.main' : error.severity === 'medium' ? 'warning.main' : 'info.main',
                  backgroundColor: 'action.hover',
                  borderRadius: 1
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Chip
                    label={error.type}
                    size="small"
                    color={error.severity === 'high' ? 'error' : error.severity === 'medium' ? 'warning' : 'default'}
                  />
                  <Typography variant="body2">
                    Expected: <strong>{error.expectedWord}</strong>
                    {error.actualWord && (
                      <> → Recognized: <strong>{error.actualWord}</strong></>
                    )}
                  </Typography>
                  <Chip label={error.severity} size="small" />
                </Stack>
              </Box>
            ))}
          </Stack>
          {errors.length > 10 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing first 10 of {errors.length} errors
            </Typography>
          )}
        </Paper>
      )}

      {/* Recommendations */}
      <Paper elevation={2} sx={{ p: 3, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TrendingUpIcon />
          <Box>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            <Typography variant="body2">
              {fluencyMetrics.overallFluencyScore >= 0.8
                ? 'Excellent reading fluency! Continue practicing to maintain this level.'
                : fluencyMetrics.overallFluencyScore >= 0.6
                ? 'Good reading progress. Focus on reducing hesitations and improving pronunciation accuracy.'
                : fluencyMetrics.overallFluencyScore >= 0.4
                ? 'Reading skills need improvement. Practice regularly and focus on difficult words.'
                : 'Significant reading challenges detected. Additional support and targeted intervention recommended.'}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default PronunciationResults;

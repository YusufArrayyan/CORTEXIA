/**
 * Take Assessment Page - Redesigned
 * Reading assessment interface following CORTEXIA design
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Chip,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  VolumeUp,
  Star,
  Timer,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortexiaPrimaryButton,
  CortexiaSecondaryButton,
  CortexiaCard,
  CortexiaStarsBadge,
  CortexiaAvatar,
  CortexiaBackButton,
  CortexiaProgressBar,
  CortexiaProgressFill,
  slideInUp,
} from '../../components/common/CortexiaComponents';
import { styled } from '@mui/material/styles';

// Styled Components
const HeaderBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(2),
}));

const ProgressSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flex: 1,
  maxWidth: '500px',
  marginLeft: theme.spacing(4),
}));

const QuestionCounter = styled(Chip)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  color: theme.palette.secondary.main,
  fontWeight: 700,
  fontSize: '1rem',
  padding: '20px 16px',
  height: '44px',
}));

const TimerChip = styled(Chip)(({ theme }) => ({
  backgroundColor: '#FFF0F0',
  color: theme.palette.primary.main,
  fontWeight: 700,
  fontSize: '1rem',
  padding: '20px 16px',
  height: '44px',
  '& .MuiChip-icon': {
    color: theme.palette.primary.main,
  },
}));

const ReadingCard = styled(CortexiaCard)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(5),
}));

const ReadingTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(3),
  textAlign: 'center',
}));

const ReadingText = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  lineHeight: 2,
  color: theme.palette.text.primary,
  textAlign: 'justify',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  borderLeft: `4px solid ${theme.palette.primary.light}`,
  backgroundColor: '#F9F9FE',
  borderRadius: '12px',
}));

const QuestionCard = styled(CortexiaCard)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(4),
}));

const QuestionText = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem',
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
}));

const AnswerOption = styled(Box)<{ selected?: boolean; correct?: boolean; incorrect?: boolean }>(
  ({ theme, selected, correct, incorrect }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2, 3),
    borderRadius: '20px',
    border: `2px solid ${
      selected
        ? theme.palette.primary.main
        : correct
        ? theme.palette.success.main
        : incorrect
        ? theme.palette.error.main
        : theme.palette.grey[300]
    }`,
    backgroundColor: selected
      ? `${theme.palette.primary.main}10`
      : correct
      ? `${theme.palette.success.main}10`
      : incorrect
      ? `${theme.palette.error.main}10`
      : '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: theme.spacing(2),
    '&:hover': {
      borderColor: theme.palette.primary.light,
      backgroundColor: `${theme.palette.primary.light}05`,
      transform: 'translateX(8px)',
    },
  })
);

const AnswerLabel = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 500,
  flex: 1,
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
}));

const DifficultyBadge = styled(Chip)<{ difficulty: 'EASY' | 'MEDIUM' | 'HARD' }>(
  ({ theme, difficulty }) => ({
    backgroundColor:
      difficulty === 'EASY'
        ? '#10B98120'
        : difficulty === 'MEDIUM'
        ? '#F59E0B20'
        : '#EF444420',
    color:
      difficulty === 'EASY'
        ? theme.palette.success.main
        : difficulty === 'MEDIUM'
        ? theme.palette.warning.main
        : theme.palette.error.main,
    fontWeight: 600,
    fontSize: '0.875rem',
  })
);

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const TakeAssessmentRedesign: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  // Mock data
  const assessmentData = {
    title: 'Kucing Kesayangan',
    difficulty: 'MEDIUM' as const,
    readingText: `Kucing adalah hewan peliharaan yang sangat lucu dan menggemaskan. Banyak orang memelihara kucing di rumah mereka. Kucing memiliki bulu yang lembut dan mata yang indah. Mereka suka bermain dengan mainan dan tidur di tempat yang nyaman.

Kucing adalah hewan yang mandiri. Mereka bisa mengurus diri sendiri dengan baik. Kucing juga sangat bersih dan suka membersihkan bulu mereka. Meskipun kucing terlihat malas, mereka sebenarnya sangat aktif di malam hari.`,
    questions: [
      {
        id: 1,
        question: 'Apa yang dijelaskan dalam bacaan di atas?',
        options: [
          'Cara merawat kucing',
          'Karakteristik kucing sebagai hewan peliharaan',
          'Makanan favorit kucing',
          'Jenis-jenis kucing',
        ],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'Menurut bacaan, kapan kucing paling aktif?',
        options: ['Pagi hari', 'Siang hari', 'Sore hari', 'Malam hari'],
        correctAnswer: 3,
      },
      {
        id: 3,
        question: 'Apa yang disebutkan tentang kebersihan kucing?',
        options: [
          'Kucing tidak suka mandi',
          'Kucing suka membersihkan bulu mereka',
          'Kucing harus dimandikan setiap hari',
          'Kucing tidak peduli kebersihan',
        ],
        correctAnswer: 1,
      },
    ] as Question[],
  };

  const totalQuestions = assessmentData.questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: answerIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score and navigate to results
    navigate('/student/assessment-results');
  };

  const currentQuestionData = assessmentData.questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestionData.id];

  // Format time
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <CortexiaPageWrapper>
      {/* Decorative Background */}
      <DecorativeShape shape="circle" color="#FFE5D1" size={100} sx={{ top: '8%', left: '5%' }} />
      <DecorativeShape shape="sparkle" color="#E8EBFF" size={60} sx={{ top: '50%', right: '5%' }} />
      <DecorativeShape shape="triangle" color="#F89847" size={70} sx={{ bottom: '15%', left: '8%' }} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <HeaderBar>
          <CortexiaBackButton
            startIcon={<ArrowBack />}
            onClick={() => navigate('/student/dashboard')}
          >
            Kembali
          </CortexiaBackButton>

          <ProgressSection>
            <QuestionCounter label={`Soal ${currentQuestion + 1} dari ${totalQuestions}`} />
            <Box sx={{ flex: 1 }}>
              <CortexiaProgressBar>
                <CortexiaProgressFill progress={progress} />
              </CortexiaProgressBar>
            </Box>
          </ProgressSection>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TimerChip icon={<Timer />} label={timeDisplay} />
            <CortexiaStarsBadge icon={<Star />} label="18" />
            <CortexiaAvatar src="/api/placeholder/56/56" sx={{ width: 56, height: 56 }} />
          </Box>
        </HeaderBar>

        {/* Reading Material (shown on first question) */}
        {currentQuestion === 0 && (
          <ReadingCard sx={{ animation: `${slideInUp} 0.6s ease-out` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <ReadingTitle>{assessmentData.title}</ReadingTitle>
              <DifficultyBadge difficulty={assessmentData.difficulty} label={assessmentData.difficulty} />
            </Box>

            <ReadingText>{assessmentData.readingText}</ReadingText>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton
                sx={{
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  '&:hover': { backgroundColor: '#4F46E5' },
                }}
              >
                <VolumeUp />
              </IconButton>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                Dengarkan teks bacaan
              </Typography>
            </Box>
          </ReadingCard>
        )}

        {/* Question Card */}
        <QuestionCard sx={{ animation: `${slideInUp} 0.6s ease-out` }}>
          <QuestionText>
            {currentQuestion + 1}. {currentQuestionData.question}
          </QuestionText>

          {/* Answer Options */}
          <Box>
            {currentQuestionData.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              return (
                <AnswerOption
                  key={index}
                  selected={isSelected}
                  onClick={() => handleAnswerSelect(currentQuestionData.id, index)}
                >
                  {isSelected ? (
                    <CheckCircle sx={{ color: 'primary.main', fontSize: '1.75rem' }} />
                  ) : (
                    <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: '1.75rem' }} />
                  )}
                  <AnswerLabel>
                    {String.fromCharCode(65 + index)}. {option}
                  </AnswerLabel>
                </AnswerOption>
              );
            })}
          </Box>
        </QuestionCard>

        {/* Navigation Buttons */}
        <ActionButtons>
          <CortexiaSecondaryButton
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            sx={{ minWidth: '150px' }}
          >
            Sebelumnya
          </CortexiaSecondaryButton>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {currentQuestion === totalQuestions - 1 ? (
              <CortexiaPrimaryButton
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length !== totalQuestions}
                sx={{ minWidth: '180px' }}
              >
                Selesai & Kirim
              </CortexiaPrimaryButton>
            ) : (
              <CortexiaPrimaryButton
                onClick={handleNext}
                disabled={selectedAnswer === undefined}
                sx={{ minWidth: '150px' }}
              >
                Selanjutnya
              </CortexiaPrimaryButton>
            )}
          </Box>
        </ActionButtons>

        {/* Question Navigation */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
          {assessmentData.questions.map((q, index) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = index === currentQuestion;
            return (
              <IconButton
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                sx={{
                  width: 44,
                  height: 44,
                  backgroundColor: isCurrent
                    ? '#F89847'
                    : isAnswered
                    ? '#10B981'
                    : '#E5E7EB',
                  color: isCurrent || isAnswered ? '#FFFFFF' : '#6B7280',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: isCurrent
                      ? '#E57A2D'
                      : isAnswered
                      ? '#059669'
                      : '#D1D5DB',
                  },
                }}
              >
                {index + 1}
              </IconButton>
            );
          })}
        </Box>
      </Container>
    </CortexiaPageWrapper>
  );
};

export default TakeAssessmentRedesign;

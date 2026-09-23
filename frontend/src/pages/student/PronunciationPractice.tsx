/**
 * Pronunciation Practice Page
 * Following CORTEXIA - Fitur Pelafalan Design
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Avatar,
  Chip,
  styled,
  keyframes,
} from '@mui/material';
import {
  ArrowBack,
  VolumeUp,
  Mic,
  MicOff,
  ArrowForward,
  Replay,
  Star,
  Lightbulb,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Decorative shapes animation
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const waveAnimation = keyframes`
  0% { height: 20%; }
  50% { height: 80%; }
  100% { height: 20%; }
`;

// Styled Components
const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #F9F9FE 0%, #FFF5F0 100%)',
  position: 'relative',
  overflow: 'hidden',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(4),
}));

const DecorativeShape = styled(Box)<{ shape: 'circle' | 'triangle' | 'sparkle', color: string }>(
  ({ theme, shape, color }) => ({
    position: 'absolute',
    opacity: 0.15,
    animation: `${float} 6s ease-in-out infinite`,
    ...(shape === 'circle' && {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: color,
    }),
    ...(shape === 'triangle' && {
      width: '60px',
      height: '60px',
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      backgroundColor: color,
    }),
    ...(shape === 'sparkle' && {
      width: '40px',
      height: '40px',
      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      backgroundColor: color,
    }),
  })
);

const HeaderBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(0, 2),
}));

const BackButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  color: theme.palette.secondary.main,
  borderRadius: '20px',
  padding: '10px 24px',
  '&:hover': {
    backgroundColor: '#D4D9FF',
  },
}));

const StarsChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#FFFFFF',
  fontSize: '1.125rem',
  fontWeight: 700,
  padding: '24px 16px',
  height: '48px',
  borderRadius: '24px',
  '& .MuiChip-icon': {
    color: '#FFFFFF',
    fontSize: '1.5rem',
  },
}));

const PromptBadge = styled(Chip)(({ theme }) => ({
  backgroundColor: '#FFF0F0',
  color: '#E57A2D',
  borderRadius: '20px',
  padding: '8px 16px',
  fontWeight: 600,
  fontSize: '0.9rem',
  '& .MuiChip-icon': {
    color: '#E57A2D',
  },
}));

const MainCard = styled(Paper)(({ theme }) => ({
  borderRadius: '32px',
  padding: theme.spacing(6),
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,252,250,0.95) 100%)',
  boxShadow: '0px 8px 40px rgba(0, 0, 0, 0.08)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  minHeight: '500px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const WordDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(3),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(3),
}));

const LetterBox = styled(Box)(({ theme }) => ({
  fontSize: '4rem',
  fontWeight: 800,
  color: theme.palette.primary.main,
  letterSpacing: '0.1em',
  textShadow: '0px 4px 12px rgba(248, 152, 71, 0.2)',
}));

const PhoneticBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  borderRadius: '20px',
  padding: theme.spacing(2, 4),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

const PhoneticText = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.main,
  fontSize: '1.25rem',
  fontWeight: 600,
  fontFamily: 'monospace',
}));

const WaveformContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  height: '60px',
  marginTop: theme.spacing(3),
}));

const WaveBar = styled(Box)<{ delay: number }>(({ theme, delay }) => ({
  width: '8px',
  backgroundColor: theme.palette.primary.main,
  borderRadius: '4px',
  animation: `${waveAnimation} 1.2s ease-in-out infinite`,
  animationDelay: `${delay}s`,
}));

const MicButton = styled(IconButton)<{ isRecording?: boolean }>(({ theme, isRecording }) => ({
  width: '140px',
  height: '140px',
  backgroundColor: theme.palette.primary.main,
  color: '#FFFFFF',
  boxShadow: isRecording
    ? '0px 0px 0px 20px rgba(248, 152, 71, 0.2), 0px 8px 32px rgba(248, 152, 71, 0.4)'
    : '0px 8px 32px rgba(248, 152, 71, 0.3)',
  transition: 'all 0.3s ease',
  animation: isRecording ? `${pulse} 1.5s ease-in-out infinite` : 'none',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.05)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '3rem',
  },
}));

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  width: '100%',
  justifyContent: 'center',
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  color: theme.palette.secondary.main,
  borderRadius: '28px',
  padding: '14px 32px',
  fontSize: '1rem',
  fontWeight: 600,
  '&:hover': {
    backgroundColor: '#D4D9FF',
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  color: '#FFFFFF',
  borderRadius: '28px',
  padding: '14px 40px',
  fontSize: '1rem',
  fontWeight: 600,
  boxShadow: '0px 4px 16px rgba(248, 152, 71, 0.3)',
  '&:hover': {
    boxShadow: '0px 6px 24px rgba(248, 152, 71, 0.4)',
    transform: 'translateY(-2px)',
  },
}));

const FeedbackBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  borderRadius: '24px',
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const BottomActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(4),
  marginTop: theme.spacing(3),
}));

const BottomActionButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '0.95rem',
  fontWeight: 500,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: 'rgba(248, 152, 71, 0.08)',
  },
}));

// Mock data for words
const wordsData = [
  { word: 'APEL', phonetic: 'a-pel', syllables: ['A', 'P', 'E', 'L'] },
  { word: 'RUMAH', phonetic: 'ru-mah', syllables: ['R', 'U', 'M', 'A', 'H'] },
  { word: 'BUKU', phonetic: 'bu-ku', syllables: ['B', 'U', 'K', 'U'] },
];

const PronunciationPractice: React.FC = () => {
  const navigate = useNavigate();
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [stars, setStars] = useState(20);
  const [feedback, setFeedback] = useState<string>('');

  const currentWord = wordsData[currentWordIndex];

  const handleBack = () => {
    navigate(-1);
  };

  const handlePlayAudio = () => {
    // Simulate audio playback
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'id-ID';
    window.speechSynthesis.speak(utterance);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setFeedback('');
    
    // Simulate recording for 3 seconds
    setTimeout(() => {
      setIsRecording(false);
      setHasRecorded(true);
      setFeedback(`Hebat! Matamu sudah fokus ke kata ini. Sekarang ucapkan: ${currentWord.phonetic.toUpperCase()}!`);
    }, 3000);
  };

  const handleRetry = () => {
    setHasRecorded(false);
    setFeedback('');
  };

  const handleNextWord = () => {
    if (currentWordIndex < wordsData.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setHasRecorded(false);
      setFeedback('');
    } else {
      // Navigate to next activity or completion screen
      alert('Selamat! Kamu telah menyelesaikan semua kata!');
    }
  };

  return (
    <PageWrapper>
      {/* Decorative Background Shapes */}
      <DecorativeShape shape="circle" color="#FFE5D1" sx={{ top: '10%', left: '5%' }} />
      <DecorativeShape shape="triangle" color="#E8EBFF" sx={{ top: '15%', right: '8%' }} />
      <DecorativeShape shape="sparkle" color="#F89847" sx={{ top: '60%', left: '10%' }} />
      <DecorativeShape shape="circle" color="#E8EBFF" sx={{ bottom: '15%', right: '5%' }} />
      <DecorativeShape shape="sparkle" color="#FFE5D1" sx={{ bottom: '20%', left: '15%' }} />
      <DecorativeShape shape="circle" color="#F89847" sx={{ top: '40%', right: '10%', opacity: 0.1 }} />

      <Container maxWidth="lg">
        {/* Header */}
        <HeaderBar>
          <BackButton startIcon={<ArrowBack />} onClick={handleBack}>
            Kembali ke Menu
          </BackButton>
          
          <StarsChip icon={<Star />} label={`${stars} Bintang`} />
          
          <Avatar
            src="/api/placeholder/48/48"
            sx={{ width: 56, height: 56, border: '3px solid #FFE5D1' }}
          />
        </HeaderBar>

        {/* Title Section */}
        <Box textAlign="center" mb={4}>
          <PromptBadge 
            icon={<Lightbulb />} 
            label="Latihan Bersuara Ceria"
          />
          <Typography
            variant="h2"
            sx={{
              mt: 2,
              mb: 1,
              fontSize: { xs: '2rem', md: '2.5rem' },
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1E2B5F 0%, #2D3E7F 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Ayo Ucapkan!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Dengarkan CORTI dan tirukan suaranya!
          </Typography>
        </Box>

        {/* Main Card */}
        <MainCard>
          {/* Word Display */}
          <Box textAlign="center" width="100%">
            <WordDisplay>
              {currentWord.syllables.map((letter, index) => (
                <LetterBox key={index}>{letter}</LetterBox>
              ))}
            </WordDisplay>

            {/* Phonetic Display */}
            <PhoneticBox>
              <PhoneticText>[ {currentWord.phonetic} ]</PhoneticText>
              <IconButton
                onClick={handlePlayAudio}
                sx={{
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  '&:hover': { backgroundColor: '#4F46E5' },
                }}
              >
                <VolumeUp />
              </IconButton>
            </PhoneticBox>

            {/* Waveform Animation */}
            {isRecording && (
              <WaveformContainer>
                {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((delay, index) => (
                  <WaveBar key={index} delay={delay} />
                ))}
              </WaveformContainer>
            )}
          </Box>

          {/* Microphone Button */}
          <Box textAlign="center" my={4}>
            <MicButton
              isRecording={isRecording}
              onClick={handleStartRecording}
              disabled={isRecording}
            >
              {isRecording ? <MicOff /> : <Mic />}
            </MicButton>
          </Box>

          {/* Feedback Message */}
          {feedback && (
            <FeedbackBox>
              <VolumeUp sx={{ color: '#6366F1', fontSize: '2rem' }} />
              <Typography variant="body1" sx={{ flex: 1, fontWeight: 500 }}>
                {feedback}
              </Typography>
            </FeedbackBox>
          )}

          {/* Action Buttons */}
          <ActionButtonsContainer>
            <SecondaryButton
              startIcon={<Mic />}
              onClick={handleRetry}
              disabled={!hasRecorded}
            >
              Tekan dan Baca
            </SecondaryButton>
            <PrimaryButton
              endIcon={<ArrowForward />}
              onClick={handleNextWord}
              disabled={!hasRecorded}
            >
              Kata Berikutnya
            </PrimaryButton>
          </ActionButtonsContainer>
        </MainCard>

        {/* Bottom Actions */}
        <BottomActions>
          <BottomActionButton startIcon={<VolumeUp />}>
            Volume Suara Cukup
          </BottomActionButton>
          <BottomActionButton startIcon={<Avatar sx={{ width: 24, height: 24 }}>C</Avatar>}>
            CORTI Menyimak
          </BottomActionButton>
        </BottomActions>
      </Container>
    </PageWrapper>
  );
};

export default PronunciationPractice;

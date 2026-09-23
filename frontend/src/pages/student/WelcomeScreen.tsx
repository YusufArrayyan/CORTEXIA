/**
 * Welcome Screen - CORTEXIA
 * Following the main CORTEXIA design with mascot and intro
 */

import React, { useState } from 'react';
import { Box, Container, Typography, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortiMascot,
  CortexiaPrimaryButton,
  CortexiaCard,
  slideInUp,
} from '../../components/common/CortexiaComponents';
import { styled, keyframes } from '@mui/material/styles';

// Additional custom styled components for this page
const WelcomeContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(4),
}));

const GreetingBubble = styled(Box)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  padding: '16px 28px',
  boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  marginBottom: theme.spacing(3),
  animation: `${slideInUp} 0.8s ease-out`,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderTop: '10px solid #FFFFFF',
  },
}));

const BrandName = styled(Typography)(({ theme }) => ({
  fontSize: '4.5rem',
  fontWeight: 900,
  textAlign: 'center',
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  letterSpacing: '-0.02em',
  animation: `${slideInUp} 1s ease-out`,
  '& span': {
    display: 'inline-block',
  },
}));

const DescriptionText = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem',
  color: theme.palette.text.secondary,
  textAlign: 'center',
  marginBottom: theme.spacing(4),
  maxWidth: '600px',
  animation: `${slideInUp} 1.2s ease-out`,
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '500px',
  marginTop: theme.spacing(4),
  animation: `${slideInUp} 1.4s ease-out`,
}));

const ProgressLabel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
  fontWeight: 600,
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: '10px',
  borderRadius: '10px',
  backgroundColor: '#E5E7EB',
  '& .MuiLinearProgress-bar': {
    borderRadius: '10px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  },
}));

const LetterAnimation = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const AnimatedLetter = styled('span')<{ delay: number }>(({ delay }) => ({
  display: 'inline-block',
  animation: `${LetterAnimation} 0.5s ease-out forwards`,
  animationDelay: `${delay}s`,
  opacity: 0,
}));

// Decorative floating letters
const FloatingLetter = styled(Box)<{ top: string; left: string; delay: number }>(
  ({ theme, top, left, delay }) => ({
    position: 'absolute',
    top,
    left,
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.palette.primary.light,
    opacity: 0.2,
    animation: `float 4s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    '@keyframes float': {
      '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
      '50%': { transform: 'translateY(-30px) rotate(10deg)' },
    },
  })
);

interface WelcomeScreenProps {
  isLoading?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ isLoading = false }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Menyiapkan pengalaman ajaib untukmu...');

  React.useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(timer);
            return 100;
          }
          const newProgress = prevProgress + 10;
          
          // Update loading text based on progress
          if (newProgress === 30) setLoadingText('Membangunkan CORTI dari tidur...');
          if (newProgress === 60) setLoadingText('Menyiapkan materi pembelajaran...');
          if (newProgress === 90) setLoadingText('Hampir siap...');
          
          return newProgress;
        });
      }, 300);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  const handleStartLearning = () => {
    navigate('/student/pronunciation-practice');
  };

  const cortexiaLetters = [
    { letter: 'C', color: '#8B4513' },
    { letter: 'O', color: '#8B4513' },
    { letter: 'R', color: '#8B4513' },
    { letter: 'T', color: '#6366F1' },
    { letter: 'E', color: '#6366F1' },
    { letter: 'X', color: '#F89847' },
    { letter: 'I', color: '#F89847' },
    { letter: 'A', color: '#F89847' },
  ];

  return (
    <CortexiaPageWrapper>
      {/* Decorative Background Elements */}
      <DecorativeShape shape="circle" color="#FFE5D1" size={120} sx={{ top: '5%', left: '10%' }} />
      <DecorativeShape shape="triangle" color="#E8EBFF" size={80} sx={{ top: '10%', right: '15%' }} />
      <DecorativeShape shape="sparkle" color="#F89847" size={60} sx={{ top: '70%', left: '8%' }} />
      <DecorativeShape shape="circle" color="#E8EBFF" size={100} sx={{ bottom: '10%', right: '12%' }} />
      <DecorativeShape shape="star" color="#F89847" size={50} sx={{ bottom: '60%', left: '85%' }} />
      
      {/* Floating Letters */}
      <FloatingLetter top="15%" left="5%" delay={0}>A</FloatingLetter>
      <FloatingLetter top="25%" left="92%" delay={0.5}>B</FloatingLetter>
      <FloatingLetter top="75%" left="10%" delay={1}>C</FloatingLetter>

      <WelcomeContainer maxWidth="lg">
        {/* Greeting Bubble */}
        <GreetingBubble>
          <Typography
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#F89847',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🍊</span>
            Ayo!
          </Typography>
        </GreetingBubble>

        {/* CORTI Mascot */}
        <CortiMascot
          sx={{
            width: 180,
            height: 180,
            fontSize: '5rem',
            background: 'linear-gradient(135deg, #F89847 0%, #FFA560 100%)',
          }}
        >
          🍊
        </CortiMascot>

        {/* CORTEXIA Brand Name */}
        <BrandName>
          {cortexiaLetters.map((item, index) => (
            <AnimatedLetter key={index} delay={index * 0.1} style={{ color: item.color }}>
              {item.letter}
            </AnimatedLetter>
          ))}
        </BrandName>

        {/* Description */}
        {!isLoading ? (
          <>
            <DescriptionText>
              Menyiapkan pengalaman ajaib untukmu...
            </DescriptionText>

            {/* Start Button */}
            <CortexiaPrimaryButton
              size="large"
              onClick={handleStartLearning}
              sx={{
                minWidth: '280px',
                fontSize: '1.25rem',
                padding: '18px 48px',
                animation: `${slideInUp} 1.6s ease-out`,
              }}
            >
              Mulai Petualangan
            </CortexiaPrimaryButton>
          </>
        ) : (
          <ProgressContainer>
            <ProgressLabel>
              <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
                🍊 {loadingText}
              </Typography>
            </ProgressLabel>
            <StyledLinearProgress variant="determinate" value={progress} />
          </ProgressContainer>
        )}
      </WelcomeContainer>
    </CortexiaPageWrapper>
  );
};

export default WelcomeScreen;

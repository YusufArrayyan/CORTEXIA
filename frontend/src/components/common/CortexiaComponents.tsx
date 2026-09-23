/**
 * CORTEXIA Design System Components
 * Reusable styled components following the brand design
 */

import { styled, Box, Button, Paper, Chip, Avatar, keyframes } from '@mui/material';

// Animations
export const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

export const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

export const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
`;

// Page Wrapper with Gradient Background
export const CortexiaPageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #F9F9FE 0%, #FFF5F0 100%)',
  position: 'relative',
  overflow: 'hidden',
}));

// Decorative Shapes
export const DecorativeShape = styled(Box)<{
  shape: 'circle' | 'triangle' | 'sparkle' | 'star';
  color: string;
  size?: number;
}>(({ theme, shape, color, size = 80 }) => ({
  position: 'absolute',
  opacity: 0.12,
  animation: `${float} 6s ease-in-out infinite`,
  pointerEvents: 'none',
  ...(shape === 'circle' && {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    backgroundColor: color,
  }),
  ...(shape === 'triangle' && {
    width: `${size}px`,
    height: `${size}px`,
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    backgroundColor: color,
  }),
  ...(shape === 'sparkle' && {
    width: `${size * 0.6}px`,
    height: `${size * 0.6}px`,
    clipPath:
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    backgroundColor: color,
  }),
  ...(shape === 'star' && {
    width: `${size * 0.8}px`,
    height: `${size * 0.8}px`,
    clipPath:
      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    backgroundColor: color,
  }),
}));

// Cortexia Mascot Container
export const CortiMascot = styled(Avatar)(({ theme }) => ({
  width: '120px',
  height: '120px',
  backgroundColor: theme.palette.primary.main,
  border: '4px solid #FFFFFF',
  boxShadow: '0px 8px 24px rgba(248, 152, 71, 0.25)',
  animation: `${bounce} 2s ease-in-out infinite`,
  '& img': {
    width: '100%',
    height: '100%',
  },
}));

// Primary Action Button (Orange Gradient)
export const CortexiaPrimaryButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  color: '#FFFFFF',
  borderRadius: '32px',
  padding: '16px 40px',
  fontSize: '1.125rem',
  fontWeight: 700,
  textTransform: 'none',
  boxShadow: '0px 4px 16px rgba(248, 152, 71, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
    boxShadow: '0px 6px 24px rgba(248, 152, 71, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    background: '#E5E7EB',
    color: '#9CA3AF',
    boxShadow: 'none',
  },
}));

// Secondary Action Button (Light Purple)
export const CortexiaSecondaryButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  color: theme.palette.secondary.main,
  borderRadius: '28px',
  padding: '14px 32px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#D4D9FF',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
}));

// Outline Button
export const CortexiaOutlineButton = styled(Button)(({ theme }) => ({
  border: `2px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  backgroundColor: 'transparent',
  borderRadius: '28px',
  padding: '12px 32px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(248, 152, 71, 0.08)',
    borderColor: theme.palette.primary.dark,
    transform: 'translateY(-2px)',
  },
}));

// Card with CORTEXIA styling
export const CortexiaCard = styled(Paper)(({ theme }) => ({
  borderRadius: '32px',
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,252,250,0.95) 100%)',
  boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0px 12px 48px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-4px)',
  },
}));

// Interactive Card (for clickable items)
export const CortexiaInteractiveCard = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  padding: theme.spacing(3),
  background: '#FFFFFF',
  boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '2px solid transparent',
  '&:hover': {
    boxShadow: '0px 8px 32px rgba(248, 152, 71, 0.15)',
    transform: 'translateY(-6px)',
    borderColor: theme.palette.primary.light,
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

// Badge/Chip components
export const CortexiaBadge = styled(Chip)(({ theme }) => ({
  backgroundColor: '#FFF0F0',
  color: theme.palette.primary.dark,
  borderRadius: '20px',
  padding: '8px 16px',
  height: 'auto',
  fontWeight: 600,
  fontSize: '0.9rem',
  '& .MuiChip-icon': {
    color: theme.palette.primary.main,
  },
}));

export const CortexiaStarsBadge = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: '#FFFFFF',
  fontSize: '1.125rem',
  fontWeight: 700,
  padding: '24px 20px',
  height: '52px',
  borderRadius: '26px',
  boxShadow: '0px 4px 16px rgba(248, 152, 71, 0.3)',
  '& .MuiChip-icon': {
    color: '#FFFFFF',
    fontSize: '1.5rem',
    marginLeft: '4px',
  },
}));

// Progress Bar
export const CortexiaProgressBar = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '12px',
  backgroundColor: '#E5E7EB',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
}));

export const CortexiaProgressFill = styled(Box)<{ progress: number }>(({ theme, progress }) => ({
  height: '100%',
  width: `${progress}%`,
  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  borderRadius: '12px',
  transition: 'width 0.5s ease',
  boxShadow: '0px 2px 8px rgba(248, 152, 71, 0.3)',
}));

// Avatar with CORTEXIA styling
export const CortexiaAvatar = styled(Avatar)(({ theme }) => ({
  border: `3px solid ${theme.palette.primary.light}20`,
  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.15)',
  },
}));

// Floating Action Button
export const CortexiaFAB = styled(Button)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  minWidth: 'auto',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  color: '#FFFFFF',
  boxShadow: '0px 8px 24px rgba(248, 152, 71, 0.35)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: '0px 12px 32px rgba(248, 152, 71, 0.45)',
  },
}));

// Back Button
export const CortexiaBackButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  color: theme.palette.secondary.main,
  borderRadius: '20px',
  padding: '10px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#D4D9FF',
  },
}));

// Glass Morphism Container
export const CortexiaGlassContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(20px)',
  borderRadius: '32px',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(4),
}));

// Icon Button with CORTEXIA styling
export const CortexiaIconButton = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: '#FFFFFF',
  boxShadow: '0px 4px 12px rgba(248, 152, 71, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.1)',
    boxShadow: '0px 6px 20px rgba(248, 152, 71, 0.4)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

// Success/Completion Card
export const CortexiaSuccessCard = styled(Paper)(({ theme }) => ({
  borderRadius: '32px',
  padding: theme.spacing(5),
  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
  color: '#FFFFFF',
  boxShadow: '0px 12px 40px rgba(16, 185, 129, 0.3)',
  textAlign: 'center',
  animation: `${slideInUp} 0.6s ease-out`,
}));

// Info Box (like feedback messages)
export const CortexiaInfoBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#E8EBFF',
  borderRadius: '24px',
  padding: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.1)',
}));

// Loading Spinner Container
export const CortexiaLoadingSpinner = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  width: '60px',
  height: '60px',
  border: `6px solid ${theme.palette.primary.light}40`,
  borderTop: `6px solid ${theme.palette.primary.main}`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
}));

export default {
  CortexiaPageWrapper,
  DecorativeShape,
  CortiMascot,
  CortexiaPrimaryButton,
  CortexiaSecondaryButton,
  CortexiaOutlineButton,
  CortexiaCard,
  CortexiaInteractiveCard,
  CortexiaBadge,
  CortexiaStarsBadge,
  CortexiaProgressBar,
  CortexiaProgressFill,
  CortexiaAvatar,
  CortexiaFAB,
  CortexiaBackButton,
  CortexiaGlassContainer,
  CortexiaIconButton,
  CortexiaSuccessCard,
  CortexiaInfoBox,
  CortexiaLoadingSpinner,
};

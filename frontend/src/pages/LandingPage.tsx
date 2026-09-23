/**
 * Landing Page - CORTEXIA
 * Exact match with Main.png reference design
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  styled,
} from '@mui/material';
import {
  Visibility,
  Mic,
  MenuBook,
  Login as LoginIcon,
} from '@mui/icons-material';
import {
  CortexiaPageWrapper,
  CortexiaPrimaryButton,
  CortexiaSecondaryButton,
  CortexiaOutlineButton,
  slideInUp,
} from '../components/common/CortexiaComponents';

// Styled Components matching exact design
const NavBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.04)',
  color: theme.palette.text.primary,
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(180deg, #FFF5F0 0%, #F9F9FE 100%)',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(8),
  position: 'relative',
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 900,
  color: '#1E2B5F',
  lineHeight: 1.2,
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    fontSize: '2.5rem',
  },
}));

const FeaturesSection = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(10),
  paddingBottom: theme.spacing(8),
  background: '#FFFFFF',
}));

const FeatureCardOrange = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #F89847 0%, #FFA560 100%)',
  borderRadius: '32px',
  padding: theme.spacing(5),
  color: '#FFFFFF',
  height: '100%',
  minHeight: '320px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  boxShadow: '0px 8px 32px rgba(248, 152, 71, 0.25)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0px 12px 40px rgba(248, 152, 71, 0.35)',
  },
}));

const FeatureCardLight = styled(Box)(({ theme }) => ({
  background: '#FFFFFF',
  border: '2px solid #F0F0F0',
  borderRadius: '32px',
  padding: theme.spacing(5),
  color: '#1E2B5F',
  height: '100%',
  minHeight: '320px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
    borderColor: '#F89847',
  },
}));

const FeatureIcon = styled(Box)<{ bgcolor: string }>(({ theme, bgcolor }) => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: bgcolor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
  },
}));

const ProgressBar = styled(Box)(({ theme }) => ({
  height: '8px',
  background: 'rgba(255, 255, 255, 0.3)',
  borderRadius: '8px',
  marginBottom: theme.spacing(3),
  overflow: 'hidden',
  position: 'relative',
}));

const ProgressFill = styled(Box)<{ width: string }>(({ width }) => ({
  height: '100%',
  width: width,
  background: '#FFFFFF',
  borderRadius: '8px',
}));

const CTASection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #E8EBFF 0%, #FFE5D1 100%)',
  borderRadius: '40px',
  padding: theme.spacing(6, 4),
  margin: theme.spacing(10, 0),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(4),
  flexWrap: 'wrap',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    textAlign: 'center',
  },
}));

const CortiMascotCTA = styled(Box)(({ theme }) => ({
  fontSize: '8rem',
  animation: 'bounce 2s ease-in-out infinite',
  '@keyframes bounce': {
    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-20px)' },
    '60%': { transform: 'translateY(-10px)' },
  },
}));

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ background: '#FFFFFF' }}>
      {/* Navigation Bar */}
      <NavBar position="sticky" elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: 1 }}>
            <Box
              component="img"
              src="/logo-cortexia.png"
              alt="CORTEXIA"
              sx={{ height: 40 }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <CortexiaOutlineButton
              size="small"
              onClick={() => navigate('/login')}
              startIcon={<LoginIcon />}
              sx={{ mr: 2 }}
            >
              Login
            </CortexiaOutlineButton>
            <CortexiaPrimaryButton size="small" onClick={() => navigate('/register')}>
              Daftar
            </CortexiaPrimaryButton>
          </Toolbar>
        </Container>
      </NavBar>

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ animation: `${slideInUp} 0.8s ease-out` }}>
                <HeroTitle>
                  EXPLORE KEMAMPUAN KAMU
                </HeroTitle>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    color: 'text.secondary',
                    fontSize: '1.125rem',
                    lineHeight: 1.8,
                  }}
                >
                  Belajar membaca sambil bermain seru bersama{' '}
                  <span style={{ color: '#F89847', fontWeight: 700 }}>CORTEXIA</span>. Temukan
                  keajaiban di setiap kata!
                </Typography>
                <CortexiaPrimaryButton size="large" onClick={() => navigate('/register')}>
                  Mulai Sekarang
                </CortexiaPrimaryButton>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  animation: `${slideInUp} 1s ease-out`,
                }}
              >
                {/* Hero Illustration - Kids reading book */}
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: '500px',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '15rem',
                      lineHeight: 1,
                      filter: 'drop-shadow(0px 8px 24px rgba(248, 152, 71, 0.2))',
                    }}
                  >
                    📚
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      fontSize: '6rem',
                      bottom: '20%',
                      right: '15%',
                      animation: 'bounce 2s ease-in-out infinite',
                      '@keyframes bounce': {
                        '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                        '40%': { transform: 'translateY(-15px)' },
                        '60%': { transform: 'translateY(-8px)' },
                      },
                    }}
                  >
                    👦
                  </Box>
                  <Box
                    sx={{
                      position: 'absolute',
                      fontSize: '6rem',
                      bottom: '20%',
                      left: '15%',
                      animation: 'bounce 2s ease-in-out infinite 0.3s',
                      '@keyframes bounce': {
                        '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                        '40%': { transform: 'translateY(-15px)' },
                        '60%': { transform: 'translateY(-8px)' },
                      },
                    }}
                  >
                    👧
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <FeaturesSection>
        <Container maxWidth="lg">
          {/* Section Header */}
          <Box textAlign="center" mb={8}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                backgroundColor: '#E8EBFF',
                padding: '8px 20px',
                borderRadius: '20px',
                mb: 3,
              }}
            >
              <Box
                component="img"
                src="/logo-cortexia.png"
                alt="CORTEXIA"
                sx={{ height: 24 }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#6366F1',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                KEAJAIBAN BELAJAR CORTEXIA
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1E2B5F',
                mb: 2,
              }}
            >
              Fitur Ramah & Seru Buat Kamu
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Dirancang khusus untuk melatih fokus kamu!
            </Typography>
          </Box>

          {/* Feature Cards */}
          <Grid container spacing={4}>
            {/* Eye Tracking Card */}
            <Grid item xs={12} md={4}>
              <FeatureCardOrange>
                <ProgressBar>
                  <ProgressFill width="60%" />
                </ProgressBar>
                <FeatureIcon bgcolor="rgba(255, 255, 255, 0.3)">
                  <Visibility sx={{ color: '#FFFFFF' }} />
                </FeatureIcon>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Eye Tracking
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, opacity: 0.95, lineHeight: 1.7 }}>
                  Ikuti arah bacaanmu dengan mata ajaiibmu! Lampu jajak manis memandu tiap kata
                  yang sedang dibaca.
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <CortexiaSecondaryButton
                    fullWidth
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#F89847',
                      '&:hover': {
                        backgroundColor: '#F3F4F6',
                      },
                    }}
                    onClick={() => navigate('/register')}
                  >
                    Coba Sekarang
                  </CortexiaSecondaryButton>
                </Box>
              </FeatureCardOrange>
            </Grid>

            {/* Pelafalan Card */}
            <Grid item xs={12} md={4}>
              <FeatureCardLight>
                <FeatureIcon bgcolor="#FFE5D1">
                  <Mic sx={{ color: '#F89847' }} />
                </FeatureIcon>
                <Typography variant="h5" fontWeight={800} gutterBottom color="#1E2B5F">
                  Pelafalan
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.7 }}>
                  Ayo baca nyaring dan bersuara seru! Sahabat CORTI siap mendengar dan memberi
                  sorakan tepuk tangan riang.
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <CortexiaPrimaryButton fullWidth onClick={() => navigate('/register')}>
                    Coba Sekarang
                  </CortexiaPrimaryButton>
                </Box>
              </FeatureCardLight>
            </Grid>

            {/* Reading Assessment Card */}
            <Grid item xs={12} md={4}>
              <FeatureCardOrange>
                <ProgressBar>
                  <ProgressFill width="80%" />
                </ProgressBar>
                <FeatureIcon bgcolor="rgba(255, 255, 255, 0.3)">
                  <MenuBook sx={{ color: '#FFFFFF' }} />
                </FeatureIcon>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Reading Assessment
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, opacity: 0.95, lineHeight: 1.7 }}>
                  Petualangan membaca seru & kumpulkan bintang! Lihat peta kemampuan membaca tanpa
                  rasa cemas dan takut salah.
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <CortexiaSecondaryButton
                    fullWidth
                    sx={{
                      backgroundColor: '#FFFFFF',
                      color: '#F89847',
                      '&:hover': {
                        backgroundColor: '#F3F4F6',
                      },
                    }}
                    onClick={() => navigate('/register')}
                  >
                    Coba Sekarang
                  </CortexiaSecondaryButton>
                </Box>
              </FeatureCardOrange>
            </Grid>
          </Grid>
        </Container>
      </FeaturesSection>

      {/* CTA Section with CORTI Mascot */}
      <Container maxWidth="lg">
        <CTASection>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={800} color="#1E2B5F" gutterBottom>
              Siap Untuk Berpetualang Hari Ini?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Hanya butuh 10 menit setiap hari untuk membantu daya fokus kamu!
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              component="img"
              src="/corti-mascot.png"
              alt="CORTI Mascot"
              sx={{
                width: 120,
                height: 120,
                animation: 'bounce 2s ease-in-out infinite',
                '@keyframes bounce': {
                  '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                  '40%': { transform: 'translateY(-20px)' },
                  '60%': { transform: 'translateY(-10px)' },
                },
              }}
            />
            <CortexiaPrimaryButton
              size="large"
              onClick={() => navigate('/register')}
              sx={{ minWidth: '200px' }}
            >
              ⏱ Mulai Sesi
            </CortexiaPrimaryButton>
          </Box>
        </CTASection>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1E2B5F', color: 'white', py: 6, mt: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box
                component="img"
                src="/logo-cortexia.png"
                alt="CORTEXIA"
                sx={{ height: 48, mb: 2 }}
              />
              <Typography variant="body2" color="grey.400" sx={{ lineHeight: 1.8 }}>
                Sistem Penilaian Kesulitan Membaca Berbasis AI Multimodal. Membantu anak Indonesia
                belajar membaca lebih baik.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                Link Cepat
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  color="grey.400"
                  sx={{ cursor: 'pointer', '&:hover': { color: '#F89847' } }}
                  onClick={() => navigate('/login')}
                >
                  Login
                </Typography>
                <Typography
                  variant="body2"
                  color="grey.400"
                  sx={{ cursor: 'pointer', '&:hover': { color: '#F89847' } }}
                  onClick={() => navigate('/register')}
                >
                  Daftar
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom fontWeight={700}>
                Kontak
              </Typography>
              <Typography variant="body2" color="grey.400" paragraph>
                Email: info@cortexia.id
              </Typography>
              <Typography variant="body2" color="grey.400">
                © 2026 CORTEXIA. All rights reserved.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;

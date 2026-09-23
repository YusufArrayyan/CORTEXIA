/**
 * Demo Page - Showcase all redesigned pages
 * Easy access to see all new designs
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Mic,
  Dashboard,
  Assessment,
  EmojiEvents,
  ArrowForward,
} from '@mui/icons-material';
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortexiaPrimaryButton,
  CortexiaCard,
} from '../components/common/CortexiaComponents';

const DemoPage: React.FC = () => {
  const navigate = useNavigate();

  const demoPages = [
    {
      title: 'Welcome Screen',
      description: 'Splash screen dengan animasi CORTI mascot',
      icon: <EmojiEvents sx={{ fontSize: '3rem' }} />,
      color: '#F89847',
      path: '/demo/welcome',
    },
    {
      title: 'Pronunciation Practice',
      description: 'Halaman latihan pelafalan kata dengan microphone',
      icon: <Mic sx={{ fontSize: '3rem' }} />,
      color: '#6366F1',
      path: '/demo/pronunciation',
    },
    {
      title: 'Student Dashboard',
      description: 'Dashboard siswa dengan stats dan progress',
      icon: <Dashboard sx={{ fontSize: '3rem' }} />,
      color: '#10B981',
      path: '/demo/dashboard',
    },
    {
      title: 'Take Assessment',
      description: 'Interface untuk mengerjakan asesmen membaca',
      icon: <Assessment sx={{ fontSize: '3rem' }} />,
      color: '#F59E0B',
      path: '/demo/assessment',
    },
  ];

  return (
    <CortexiaPageWrapper>
      <DecorativeShape shape="circle" color="#FFE5D1" size={120} sx={{ top: '5%', left: '8%' }} />
      <DecorativeShape shape="sparkle" color="#6366F1" size={70} sx={{ top: '15%', right: '10%' }} />
      <DecorativeShape shape="triangle" color="#F89847" size={90} sx={{ bottom: '20%', left: '10%' }} />
      <DecorativeShape shape="star" color="#E8EBFF" size={60} sx={{ bottom: '10%', right: '15%' }} />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              mb: 2,
              background: 'linear-gradient(135deg, #1E2B5F 0%, #F89847 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            CORTEXIA Redesign Demo
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Pilih halaman untuk melihat redesign baru
          </Typography>
        </Box>

        {/* Demo Cards */}
        <Grid container spacing={4}>
          {demoPages.map((page, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <CortexiaCard
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0px 16px 48px rgba(0, 0, 0, 0.15)',
                  },
                }}
                onClick={() => navigate(page.path)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '140px',
                    backgroundColor: `${page.color}15`,
                    borderRadius: '20px',
                    mb: 3,
                  }}
                >
                  <Box sx={{ color: page.color }}>{page.icon}</Box>
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  {page.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flex: 1 }}>
                  {page.description}
                </Typography>
                <CortexiaPrimaryButton
                  fullWidth
                  endIcon={<ArrowForward />}
                  onClick={() => navigate(page.path)}
                >
                  Lihat Demo
                </CortexiaPrimaryButton>
              </CortexiaCard>
            </Grid>
          ))}
        </Grid>

        {/* Info Box */}
        <Box
          sx={{
            mt: 6,
            p: 4,
            backgroundColor: '#E8EBFF',
            borderRadius: '24px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            📚 Dokumentasi Lengkap
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Lihat DESIGN_SYSTEM.md dan REDESIGN_README.md untuk panduan lengkap
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Component library tersedia di: <code>src/components/common/CortexiaComponents.tsx</code>
          </Typography>
        </Box>
      </Container>
    </CortexiaPageWrapper>
  );
};

export default DemoPage;

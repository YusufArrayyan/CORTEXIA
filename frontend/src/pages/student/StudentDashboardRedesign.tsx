/**
 * Student Dashboard Redesign - CORTEXIA
 * Following the CORTEXIA design system
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Avatar,
  IconButton,
  styled,
} from '@mui/material';
import {
  Star,
  TrendingUp,
  MenuBook,
  PlayArrow,
  EmojiEvents,
  Lightbulb,
  ArrowForward,
  School,
  Mic,
} from '@mui/icons-material';
import {
  CortexiaPageWrapper,
  DecorativeShape,
  CortexiaPrimaryButton,
  CortexiaSecondaryButton,
  CortexiaInteractiveCard,
  CortexiaBadge,
  CortexiaStarsBadge,
  CortexiaProgressBar,
  CortexiaProgressFill,
  CortexiaAvatar,
  slideInUp,
} from '../../components/common/CortexiaComponents';
import { useAuth } from '../../contexts/AuthContext';

// Custom styled components for dashboard
const DashboardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3, 2),
  animation: `${slideInUp} 0.6s ease-out`,
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  flex: 1,
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(5),
}));

const StatCard = styled(CortexiaInteractiveCard)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,248,245,0.95) 100%)',
}));

const StatIcon = styled(Box)<{ bgColor: string }>(({ theme, bgColor }) => ({
  width: '72px',
  height: '72px',
  borderRadius: '50%',
  backgroundColor: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  boxShadow: `0px 8px 24px ${bgColor}40`,
  '& .MuiSvgIcon-root': {
    fontSize: '2rem',
    color: '#FFFFFF',
  },
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 800,
  color: theme.palette.primary.main,
  lineHeight: 1,
  marginBottom: theme.spacing(0.5),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(5),
}));

const ActivityCard = styled(CortexiaInteractiveCard)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  gap: theme.spacing(2),
}));

const ActivityIcon = styled(Box)<{ bgColor: string }>(({ theme, bgColor }) => ({
  width: '56px',
  height: '56px',
  minWidth: '56px',
  borderRadius: '16px',
  backgroundColor: bgColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: '1.75rem',
    color: '#FFFFFF',
  },
}));

const LevelBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: '#FFF0F0',
  padding: '8px 20px',
  borderRadius: '20px',
  border: `2px solid ${theme.palette.primary.light}40`,
}));

const StudentDashboardRedesign: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    stars: 248,
    assessmentsCompleted: 12,
    currentLevel: 'Mahir',
    progressPercentage: 68,
    weeklyProgress: 85,
    pronunciationScore: 92,
  });

  useEffect(() => {
    // TODO: Fetch student stats from API
  }, []);

  const quickActions = [
    {
      id: 1,
      title: 'Latihan Pelafalan',
      description: 'Praktik pengucapan kata dengan CORTI',
      icon: <Mic />,
      bgColor: '#F89847',
      action: () => navigate('/student/pronunciation-practice'),
    },
    {
      id: 2,
      title: 'Mulai Asesmen Baru',
      description: 'Uji kemampuan membacamu',
      icon: <PlayArrow />,
      bgColor: '#6366F1',
      action: () => navigate('/student/take-assessment'),
    },
    {
      id: 3,
      title: 'Lihat Progress',
      description: 'Pantau perkembangan belajarmu',
      icon: <TrendingUp />,
      bgColor: '#10B981',
      action: () => navigate('/student/my-progress'),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Latihan Kata: APEL',
      subtitle: 'Skor Pelafalan: 95%',
      time: '2 jam yang lalu',
      icon: <Mic />,
      iconColor: '#F89847',
      badge: 'Sempurna!',
      badgeColor: '#10B981',
    },
    {
      id: 2,
      title: 'Asesmen: Kucing Kesayangan',
      subtitle: 'Skor Akhir: 85/100',
      time: 'Kemarin',
      icon: <MenuBook />,
      iconColor: '#6366F1',
      badge: 'Bagus',
      badgeColor: '#F89847',
    },
    {
      id: 3,
      title: 'Pencapaian Baru!',
      subtitle: 'Mendapat Badge "Pembaca Rajin"',
      time: '3 hari yang lalu',
      icon: <EmojiEvents />,
      iconColor: '#FFD700',
      badge: 'Prestasi',
      badgeColor: '#FFD700',
    },
  ];

  return (
    <CortexiaPageWrapper>
      {/* Decorative Background Elements */}
      <DecorativeShape shape="circle" color="#FFE5D1" size={100} sx={{ top: '5%', right: '5%' }} />
      <DecorativeShape shape="triangle" color="#E8EBFF" size={70} sx={{ top: '40%', left: '3%' }} />
      <DecorativeShape shape="sparkle" color="#F89847" size={50} sx={{ bottom: '10%', right: '8%' }} />
      <DecorativeShape shape="star" color="#6366F1" size={60} sx={{ top: '60%', right: '5%' }} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <DashboardHeader>
          <WelcomeSection>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                background: 'linear-gradient(135deg, #1E2B5F 0%, #F89847 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Halo, {user?.fullName || 'Pelajar'}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.125rem', mb: 2 }}>
              Semangat belajar hari ini!
            </Typography>
            <LevelBadge>
              <School sx={{ color: '#F89847', fontSize: '1.25rem' }} />
              <Typography sx={{ fontWeight: 600, color: '#1E2B5F' }}>
                Level: {stats.currentLevel}
              </Typography>
            </LevelBadge>
          </WelcomeSection>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CortexiaStarsBadge icon={<Star />} label={`${stats.stars}`} />
            <CortexiaAvatar
              src="/api/placeholder/64/64"
              sx={{ width: 64, height: 64 }}
            />
          </Box>
        </DashboardHeader>

        {/* Stats Cards */}
        <StatsGrid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon bgColor="#F89847">
                <MenuBook />
              </StatIcon>
              <StatValue>{stats.assessmentsCompleted}</StatValue>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Asesmen Selesai
              </Typography>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon bgColor="#6366F1">
                <TrendingUp />
              </StatIcon>
              <StatValue>{stats.weeklyProgress}%</StatValue>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Progress Minggu Ini
              </Typography>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon bgColor="#10B981">
                <Mic />
              </StatIcon>
              <StatValue>{stats.pronunciationScore}%</StatValue>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Skor Pelafalan
              </Typography>
            </StatCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <StatIcon bgColor="#FFD700">
                <EmojiEvents />
              </StatIcon>
              <StatValue>{Math.floor(stats.stars / 20)}</StatValue>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Pencapaian
              </Typography>
            </StatCard>
          </Grid>
        </StatsGrid>

        {/* Overall Progress */}
        <Box sx={{ mb: 5 }}>
          <CortexiaInteractiveCard sx={{ padding: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Progress Keseluruhan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Terus tingkatkan kemampuanmu!
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {stats.progressPercentage}%
              </Typography>
            </Box>
            <CortexiaProgressBar>
              <CortexiaProgressFill progress={stats.progressPercentage} />
            </CortexiaProgressBar>
          </CortexiaInteractiveCard>
        </Box>

        {/* Quick Actions */}
        <SectionHeader>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Mulai Belajar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pilih aktivitas untuk melanjutkan
            </Typography>
          </Box>
        </SectionHeader>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {quickActions.map((action) => (
            <Grid item xs={12} md={4} key={action.id}>
              <ActivityCard onClick={action.action}>
                <ActivityIcon bgColor={action.bgColor}>{action.icon}</ActivityIcon>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </Box>
                <IconButton>
                  <ArrowForward />
                </IconButton>
              </ActivityCard>
            </Grid>
          ))}
        </Grid>

        {/* Recent Activities */}
        <SectionHeader>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Aktivitas Terakhir
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ringkasan kegiatan belajarmu
            </Typography>
          </Box>
          <CortexiaSecondaryButton size="small">
            Lihat Semua
          </CortexiaSecondaryButton>
        </SectionHeader>

        <Grid container spacing={2}>
          {recentActivities.map((activity) => (
            <Grid item xs={12} key={activity.id}>
              <ActivityCard>
                <ActivityIcon bgColor={activity.iconColor}>{activity.icon}</ActivityIcon>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {activity.title}
                    </Typography>
                    <CortexiaBadge
                      label={activity.badge}
                      size="small"
                      sx={{ backgroundColor: `${activity.badgeColor}20`, color: activity.badgeColor }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {activity.subtitle}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activity.time}
                  </Typography>
                </Box>
              </ActivityCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </CortexiaPageWrapper>
  );
};

export default StudentDashboardRedesign;

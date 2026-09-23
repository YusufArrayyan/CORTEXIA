import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Avatar
} from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as AchievementIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const MyProgress: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const skills = [
    { name: 'Pelafalan', progress: 75, level: 'Bagus' },
    { name: 'Kecepatan Membaca', progress: 60, level: 'Sedang' },
    { name: 'Pemahaman', progress: 85, level: 'Sangat Bagus' },
    { name: 'Fokus Mata', progress: 70, level: 'Bagus' }
  ];

  const recentSessions = [
    { date: '20 Sep 2026', duration: '12 menit', score: 85, material: 'Cerita Pendek: Kura-kura' },
    { date: '18 Sep 2026', duration: '10 menit', score: 78, material: 'Paragraf Deskripsi' },
    { date: '16 Sep 2026', duration: '15 menit', score: 82, material: 'Dongeng: Si Kancil' },
    { date: '14 Sep 2026', duration: '11 menit', score: 80, material: 'Teks Narasi' }
  ];

  const achievements = [
    { title: 'Rajin Belajar 7 Hari', icon: '🔥', date: '15 Sep 2026', description: 'Belajar 7 hari berturut-turut' },
    { title: 'Pembaca Cepat', icon: '⚡', date: '10 Sep 2026', description: 'Membaca 100 kata/menit' },
    { title: 'Pelafalan Sempurna', icon: '🎯', date: '5 Sep 2026', description: '95% akurasi pelafalan' },
    { title: 'Bintang Kelas', icon: '⭐', date: '1 Sep 2026', description: 'Skor tertinggi di kelas' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Perkembanganku 📈
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Lihat bagaimana kemampuan membacamu berkembang
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <TrendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5">80%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Kemajuan Keseluruhan
                  </Typography>
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={80} sx={{ height: 8, borderRadius: 4 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5">24</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Hari Belajar
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="success.main" fontWeight="bold">
                +3 hari minggu ini
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <AchievementIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5">8</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Prestasi Diraih
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="warning.main" fontWeight="bold">
                2 prestasi baru minggu ini
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Content */}
      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Kemampuan" />
            <Tab label="Riwayat Latihan" />
            <Tab label="Prestasi" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {skills.map((skill, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {skill.name}
                      </Typography>
                      <Chip 
                        label={skill.level} 
                        size="small" 
                        color={skill.progress >= 80 ? 'success' : skill.progress >= 60 ? 'primary' : 'warning'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={skill.progress} 
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {skill.progress}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, p: 3, backgroundColor: 'info.light', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                💡 Tips untuk Berkembang:
              </Typography>
              <Typography variant="body2">
                Latihlah kecepatan membacamu dengan membaca 15 menit setiap hari. 
                Fokus pada kata-kata yang sulit dan ulangi sampai lancar!
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <List>
              {recentSessions.map((session, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    mb: 1, 
                    backgroundColor: 'background.default',
                    borderRadius: 2 
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {session.material}
                        </Typography>
                        <Chip 
                          label={`Skor: ${session.score}`} 
                          size="small" 
                          color={session.score >= 80 ? 'success' : 'primary'}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {session.date} • Durasi: {session.duration}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              {achievements.map((achievement, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Typography variant="h2">{achievement.icon}</Typography>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {achievement.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {achievement.description}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Diraih: {achievement.date}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MyProgress;

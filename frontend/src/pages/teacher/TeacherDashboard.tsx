import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Avatar, Box } from '@mui/material';
import { People, Assessment, TrendingUp, School } from '@mui/icons-material';
import DashboardLayout from '../../layouts/DashboardLayout';

const TeacherDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Dashboard Guru 👨‍🏫
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><People /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>24</Typography>
                    <Typography variant="body2" color="text.secondary">Total Siswa</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}><Assessment /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>156</Typography>
                    <Typography variant="body2" color="text.secondary">Total Assessment</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}><TrendingUp /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>78%</Typography>
                    <Typography variant="body2" color="text.secondary">Rata-rata Kelas</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}><School /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>3</Typography>
                    <Typography variant="body2" color="text.secondary">Kelas Aktif</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </DashboardLayout>
  );
};

export default TeacherDashboard;

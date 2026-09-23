import React from 'react';
import { Container, Typography, Grid, Card, CardContent, Avatar, Box } from '@mui/material';
import { People, Assessment, School, Storage } from '@mui/icons-material';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Admin Dashboard 🔧
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><People /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>142</Typography>
                    <Typography variant="body2" color="text.secondary">Total Users</Typography>
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
                    <Typography variant="h4" fontWeight={700}>1,234</Typography>
                    <Typography variant="body2" color="text.secondary">Total Assessments</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}><School /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>15</Typography>
                    <Typography variant="body2" color="text.secondary">Schools</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}><Storage /></Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>26MB</Typography>
                    <Typography variant="body2" color="text.secondary">Database Size</Typography>
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

export default AdminDashboard;

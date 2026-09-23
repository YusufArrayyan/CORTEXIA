import React from 'react';
import { Container, Typography, Card, CardContent, Switch, FormControlLabel, Divider } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminSettings: React.FC = () => {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          System Settings ⚙️
        </Typography>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>General Settings</Typography>
            <FormControlLabel control={<Switch defaultChecked />} label="Enable New Registrations" />
            <Divider sx={{ my: 2 }} />
            <FormControlLabel control={<Switch defaultChecked />} label="Enable Email Notifications" />
            <Divider sx={{ my: 2 }} />
            <FormControlLabel control={<Switch />} label="Maintenance Mode" />
          </CardContent>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default AdminSettings;

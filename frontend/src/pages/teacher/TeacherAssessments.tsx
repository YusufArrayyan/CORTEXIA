import React from 'react';
import { Container, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';

const TeacherAssessments: React.FC = () => {
  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Semua Assessments 📊
        </Typography>
        <Card sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Siswa</strong></TableCell>
                <TableCell><strong>Teks</strong></TableCell>
                <TableCell><strong>Skor</strong></TableCell>
                <TableCell><strong>Tanggal</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Ahmad Fauzi</TableCell>
                <TableCell>Kucing Kesayangan</TableCell>
                <TableCell>85%</TableCell>
                <TableCell>2024-01-15</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default TeacherAssessments;

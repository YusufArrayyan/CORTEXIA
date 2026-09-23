import React from 'react';
import { Container, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';

const TeacherStudents: React.FC = () => {
  const students = [
    { id: 1, name: 'Ahmad Fauzi', grade: 5, assessments: 12, avgScore: 85, level: 'Menengah' },
    { id: 2, name: 'Siti Nurhaliza', grade: 5, assessments: 15, avgScore: 92, level: 'Mahir' },
    { id: 3, name: 'Budi Santoso', grade: 5, assessments: 8, avgScore: 68, level: 'Pemula' },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Daftar Siswa 👥
        </Typography>

        <Card sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nama</strong></TableCell>
                <TableCell><strong>Kelas</strong></TableCell>
                <TableCell><strong>Assessments</strong></TableCell>
                <TableCell><strong>Rata-rata</strong></TableCell>
                <TableCell><strong>Level</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} hover sx={{ cursor: 'pointer' }}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.assessments}</TableCell>
                  <TableCell>{student.avgScore}%</TableCell>
                  <TableCell>
                    <Chip label={student.level} color="primary" size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default TeacherStudents;

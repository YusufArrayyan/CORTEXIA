import React from 'react';
import { Container, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminUsers: React.FC = () => {
  const users = [
    { id: 1, name: 'Ahmad Fauzi', email: 'ahmad@example.com', role: 'STUDENT', status: 'Active' },
    { id: 2, name: 'Prof. Budi', email: 'budi@example.com', role: 'TEACHER', status: 'Active' },
    { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', status: 'Active' },
  ];

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          User Management 👥
        </Typography>

        <Card sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Chip label={user.role} size="small" /></TableCell>
                  <TableCell><Chip label={user.status} color="success" size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Container>
    </DashboardLayout>
  );
};

export default AdminUsers;

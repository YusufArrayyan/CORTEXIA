import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  status: 'active' | 'inactive';
  lastLogin: string;
}

const UserManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Mock data
  const users: User[] = [
    { id: '1', name: 'Dr. Sarah Ahmad', email: 'sarah@cortexia.id', role: 'teacher', status: 'active', lastLogin: '2 jam lalu' },
    { id: '2', name: 'Budi Santoso', email: 'budi@cortexia.id', role: 'admin', status: 'active', lastLogin: '5 menit lalu' },
    { id: '3', name: 'Siti Nurhaliza', email: 'siti@gmail.com', role: 'parent', status: 'active', lastLogin: '1 hari lalu' },
    { id: '4', name: 'Ahmad Rizki', email: 'rizki@student.cortexia.id', role: 'student', status: 'active', lastLogin: '3 jam lalu' },
    { id: '5', name: 'Dewi Lestari', email: 'dewi@cortexia.id', role: 'teacher', status: 'inactive', lastLogin: '1 minggu lalu' }
  ];

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddUser = () => {
    setOpenDialog(true);
    handleMenuClose();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
      admin: 'primary',
      teacher: 'success',
      parent: 'warning',
      student: 'info'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      teacher: 'Guru',
      parent: 'Orang Tua',
      student: 'Siswa'
    };
    return labels[role] || role;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Manajemen Pengguna
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kelola akun pengguna sistem CORTEXIA
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Tambah Pengguna
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Cari pengguna berdasarkan nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pengguna</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Login Terakhir</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2 }}>
                            {user.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight="bold">
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleLabel(user.role)}
                          size="small"
                          color={getRoleColor(user.role)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.status === 'active' ? <ActiveIcon /> : <BlockIcon />}
                          label={user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                          size="small"
                          color={user.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {user.lastLogin}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleMenuClick(e, user)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={users.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Baris per halaman:"
          />
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <BlockIcon sx={{ mr: 1 }} fontSize="small" />
          {selectedUser?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Hapus
        </MenuItem>
      </Menu>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Pengguna Baru</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Nama Lengkap" fullWidth required />
            <TextField label="Email" type="email" fullWidth required />
            <TextField label="Password" type="password" fullWidth required />
            <TextField
              select
              label="Role"
              fullWidth
              required
              defaultValue="student"
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="teacher">Guru</MenuItem>
              <MenuItem value="parent">Orang Tua</MenuItem>
              <MenuItem value="student">Siswa</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Simpan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

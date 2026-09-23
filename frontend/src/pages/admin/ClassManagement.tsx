import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  People as PeopleIcon,
  Person as TeacherIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  teacher: string;
  studentCount: number;
  activeAssessments: number;
  averageProgress: number;
  status: 'active' | 'inactive';
}

const ClassManagement: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  // Mock data
  const classes: ClassRoom[] = [
    {
      id: '1',
      name: 'Kelas 3A',
      grade: '3',
      teacher: 'Dr. Sarah Ahmad',
      studentCount: 28,
      activeAssessments: 5,
      averageProgress: 78,
      status: 'active'
    },
    {
      id: '2',
      name: 'Kelas 3B',
      grade: '3',
      teacher: 'Dewi Lestari',
      studentCount: 25,
      activeAssessments: 3,
      averageProgress: 82,
      status: 'active'
    },
    {
      id: '3',
      name: 'Kelas 4A',
      grade: '4',
      teacher: 'Ahmad Wijaya',
      studentCount: 30,
      activeAssessments: 7,
      averageProgress: 75,
      status: 'active'
    },
    {
      id: '4',
      name: 'Kelas 4B',
      grade: '4',
      teacher: 'Siti Nurhaliza',
      studentCount: 27,
      activeAssessments: 4,
      averageProgress: 80,
      status: 'active'
    }
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, classRoom: ClassRoom) => {
    setAnchorEl(event.currentTarget);
    setSelectedClass(classRoom);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddClass = () => {
    setOpenDialog(true);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 60) return 'primary';
    return 'warning';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Manajemen Kelas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Kelola kelas dan monitor aktivitas pembelajaran
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClass}
        >
          Tambah Kelas
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary.main">
                {classes.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Kelas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {classes.reduce((sum, c) => sum + c.studentCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Siswa
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {classes.reduce((sum, c) => sum + c.activeAssessments, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asesmen Aktif
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {Math.round(
                  classes.reduce((sum, c) => sum + c.averageProgress, 0) / classes.length
                )}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rata-rata Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Classes Grid */}
      <Grid container spacing={3}>
        {classes.map((classRoom) => (
          <Grid item xs={12} sm={6} md={4} key={classRoom.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {classRoom.name}
                    </Typography>
                    <Chip
                      label={`Kelas ${classRoom.grade}`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, classRoom)}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TeacherIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {classRoom.teacher}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {classRoom.studentCount} siswa
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 2,
                    backgroundColor: 'background.default',
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Box>
                    <Typography variant="h6">{classRoom.activeAssessments}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Asesmen Aktif
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6">
                      <Chip
                        label={`${classRoom.averageProgress}%`}
                        size="small"
                        color={getProgressColor(classRoom.averageProgress)}
                      />
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rata-rata Progress
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" fullWidth>
                    Lihat Detail
                  </Button>
                  <AvatarGroup max={3} sx={{ justifyContent: 'flex-end' }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>A</Avatar>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>B</Avatar>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>C</Avatar>
                  </AvatarGroup>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Kelas
        </MenuItemComponent>
        <MenuItemComponent onClick={handleMenuClose}>
          <PeopleIcon sx={{ mr: 1 }} fontSize="small" />
          Kelola Siswa
        </MenuItemComponent>
        <MenuItemComponent onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Hapus Kelas
        </MenuItemComponent>
      </Menu>

      {/* Add Class Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tambah Kelas Baru</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField label="Nama Kelas" fullWidth required placeholder="Contoh: Kelas 3A" />
            <TextField
              select
              label="Tingkat Kelas"
              fullWidth
              required
              defaultValue=""
            >
              <MenuItem value="1">Kelas 1</MenuItem>
              <MenuItem value="2">Kelas 2</MenuItem>
              <MenuItem value="3">Kelas 3</MenuItem>
              <MenuItem value="4">Kelas 4</MenuItem>
              <MenuItem value="5">Kelas 5</MenuItem>
              <MenuItem value="6">Kelas 6</MenuItem>
            </TextField>
            <TextField
              select
              label="Guru Pengampu"
              fullWidth
              required
              defaultValue=""
            >
              <MenuItem value="1">Dr. Sarah Ahmad</MenuItem>
              <MenuItem value="2">Dewi Lestari</MenuItem>
              <MenuItem value="3">Ahmad Wijaya</MenuItem>
              <MenuItem value="4">Siti Nurhaliza</MenuItem>
            </TextField>
            <TextField
              label="Kapasitas Siswa"
              type="number"
              fullWidth
              required
              defaultValue={30}
            />
            <TextField
              label="Deskripsi (Opsional)"
              fullWidth
              multiline
              rows={3}
              placeholder="Deskripsi singkat tentang kelas ini..."
            />
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

export default ClassManagement;

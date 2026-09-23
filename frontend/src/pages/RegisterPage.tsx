/**
 * Register Page - CORTEXIA
 * User registration with Supabase Auth
 */

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School,
  Email,
  Lock,
  Person,
  Badge,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'STUDENT',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleRoleChange = (e: SelectChangeEvent) => {
    setFormData({
      ...formData,
      role: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password || !formData.fullName) {
      setError('Semua field harus diisi');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Format email tidak valid');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
      });
      
      setSuccess('Registrasi berhasil! Silakan login.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
          {/* Logo & Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/logo-cortexia.png"
              alt="CORTEXIA"
              sx={{ height: 100, mb: 2, mx: 'auto', display: 'block' }}
            />
            <Typography variant="body1" color="text.secondary">
              Buat akun baru
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nama Lengkap"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              margin="normal"
              helperText="Username untuk login (tanpa spasi)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              margin="normal"
              helperText="Minimal 6 karakter"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Konfirmasi Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="STUDENT">Siswa</MenuItem>
                <MenuItem value="TEACHER">Guru</MenuItem>
                <MenuItem value="PARENT">Orang Tua</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Daftar'}
            </Button>
          </form>

          {/* Divider */}
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Sudah punya akun?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>
                Login di sini
              </Link>
            </Typography>
          </Box>

          {/* Back to Home */}
          <Box sx={{ textAlign: 'center' }}>
            <Link component={RouterLink} to="/" variant="body2" color="text.secondary">
              ← Kembali ke Beranda
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;

/**
 * Register Page Component
 */

import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings as LogoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'STUDENT',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      // Navigation handled by App.tsx based on user role
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Logo and Title */}
      <Box textAlign="center" mb={3}>
        <LogoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Daftar Akun
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Buat akun baru untuk menggunakan CORTEXIA
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
          margin="normal"
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          margin="normal"
          required
          disabled={loading}
          helperText="3-50 karakter, hanya huruf, angka, dan underscore"
        />

        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
          disabled={loading}
        />

        <TextField
          fullWidth
          select
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          margin="normal"
          required
          disabled={loading}
        >
          <MenuItem value="STUDENT">Student</MenuItem>
          <MenuItem value="TEACHER">Teacher</MenuItem>
          <MenuItem value="PARENT">Parent</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
          disabled={loading}
          helperText="Minimal 8 karakter"
          InputProps={{
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
          label="Confirm Password"
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange}
          margin="normal"
          required
          disabled={loading}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? 'Creating account...' : 'Daftar'}
        </Button>
      </form>

      {/* Login Link */}
      <Box textAlign="center" mt={2}>
        <Typography variant="body2">
          Sudah punya akun?{' '}
          <Link component={RouterLink} to="/login" underline="hover">
            Login di sini
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;

/**
 * Login Page - CORTEXIA
 * Authentication page with Supabase integration
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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School,
  Email,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Redirect akan dihandle oleh AuthContext
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
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
              Masuk ke akun Anda
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Masuk'}
            </Button>
          </form>

          {/* Divider */}
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Belum punya akun?{' '}
              <Link component={RouterLink} to="/register" fontWeight={600}>
                Daftar di sini
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

        {/* Demo Accounts Info */}
        <Paper elevation={2} sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.9)' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={600}>
            💡 Demo Accounts (Untuk Testing):
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Student: student@cortexia.id / password123
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Teacher: teacher@cortexia.id / password123
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Admin: admin@cortexia.id / password123
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;

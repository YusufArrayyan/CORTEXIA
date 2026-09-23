/**
 * Login Page Component
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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AdminPanelSettings as LogoIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation handled by App.tsx based on user role
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
          CORTEXIA
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Multimodal AI-Based Reading Difficulty Profiling
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email atau Username"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          required
          autoFocus
          disabled={loading}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          required
          disabled={loading}
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3, mb: 2 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      {/* Register Link */}
      <Box textAlign="center" mt={2}>
        <Typography variant="body2">
          Belum punya akun?{' '}
          <Link component={RouterLink} to="/register" underline="hover">
            Daftar di sini
          </Link>
        </Typography>
      </Box>

      {/* Demo Credentials */}
      <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
        <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
          Demo Credentials:
        </Typography>
        <Typography variant="caption" display="block">
          • Student: student@demo.com / Demo123
        </Typography>
        <Typography variant="caption" display="block">
          • Teacher: teacher@demo.com / Demo123
        </Typography>
        <Typography variant="caption" display="block">
          • Parent: parent@demo.com / Demo123
        </Typography>
        <Typography variant="caption" display="block">
          • Admin: admin@demo.com / Demo123
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;

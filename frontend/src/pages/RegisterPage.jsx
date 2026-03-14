import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
  Box, Typography, TextField, Button, Link, Alert,
  InputAdornment, IconButton, CircularProgress, useTheme, useMediaQuery
} from '@mui/material';
import {
  Visibility, VisibilityOff,
  Inventory2Outlined as InventoryIcon,
  PersonAddOutlined as PersonAddIcon
} from '@mui/icons-material';

function RegisterPage() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (import.meta.env.VITE_APP_ENV === 'local') {
        await apiLocal.post('/api/register', {
          name,
          department,
          username,
          password,
          role: 'user' // Default role
        });
        setSuccess('Registration successful! You will be redirected to the login page.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Supabase requires an email, so we append a dummy domain to the username if not an email
        const email = username.includes('@') ? username : `${username}@itam.local`;

        const { data, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              name: name,
              department: department,
              role: 'user'
            }
          }
        });

        if (authError) throw authError;

        setSuccess('Registration successful! You will be redirected to the login page.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0d9488 100%)',
        p: 2,
      }}
    >
      <Box
        className="fade-in-up"
        sx={{
          width: '100%',
          maxWidth: 440,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            py: { xs: 2.5, sm: 3.5 },
            px: 4,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 }, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 1.5,
            }}
          >
            <InventoryIcon sx={{ color: '#fff', fontSize: { xs: 24, sm: 28 } }} />
          </Box>
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ color: '#fff', fontWeight: 800 }}>
            IT Asset Management
          </Typography>
        </Box>

        {/* Form */}
        <Box sx={{ px: 4, py: 3.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
            Create New Account
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
            Fill in the details below to register
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleRegister}>
            <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)}
              required autoFocus autoComplete="name" sx={{ mb: 2 }} />
            <TextField fullWidth label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}
              sx={{ mb: 2 }} />
            <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)}
              required autoComplete="username" sx={{ mb: 2 }} />
            <TextField
              fullWidth label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
              sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}
            >
              {loading ? 'Processing...' : 'Register'}
            </Button>
          </Box>

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600} color="primary">
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default RegisterPage;

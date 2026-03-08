import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
  Box, Typography, TextField, Button, Alert,
  InputAdornment, IconButton, CircularProgress, Paper
} from '@mui/material';
import {
  Visibility, VisibilityOff,
  Inventory2Outlined as InventoryIcon,
  LockOutlined as LockIcon
} from '@mui/icons-material';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (import.meta.env.VITE_APP_ENV === 'local') {
        const { data } = await apiLocal.post('/login', {
          username,
          password
        });
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        const email = username.includes('@') ? username : `${username}@itam.local`;
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (authError) throw authError;

        if (data.session) {
          localStorage.setItem('token', data.session.access_token);
          navigate('/');
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#f1f5f9' }}>
      <Paper elevation={2} sx={{ width: '100%', maxWidth: 400, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', py: 4, px: 3, textAlign: 'center', color: 'white' }}>
          <InventoryIcon sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight={700}>ITAM System</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Simplify your asset management</Typography>
        </Box>

        <Box sx={{ px: 4, py: 4 }}>
          <Typography variant="h6" fontWeight={600} mb={1}>Sign In</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Enter your credentials to continue</Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth label="Username" name="username" autoFocus
              value={username} onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 4 }}
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
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
              sx={{ py: 1.5, textTransform: 'none', fontSize: '1rem' }}
            >
              {loading ? 'Processing...' : 'Sign In'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
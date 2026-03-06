import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, MenuItem } from '@mui/material';
import { PersonAddOutlined as PersonAddIcon } from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';

function AddUserPage() {
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const email = username.includes('@') ? username : `${username}@itam.local`;

            if (import.meta.env.VITE_APP_ENV === 'local') {
                await apiLocal.post('/register', {
                    email,
                    password,
                    name,
                    department,
                    role
                });

                setSuccess("User successfully added!");
                setName(''); setDepartment(''); setUsername(''); setPassword(''); setRole('user');
            } else {
                const { data, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            name: name,
                            department: department,
                            role: role
                        }
                    }
                });

                if (authError) throw authError;

                setSuccess("User successfully added!");
                setName(''); setDepartment(''); setUsername(''); setPassword(''); setRole('user');
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError(err.message || 'Failed to add user.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="fade-in-up" sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 0, md: 4 } }}>
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonAddIcon color="primary" /> Add New User
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add a new user account to the IT Asset Management system.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleRegister}>
                    <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required sx={{ mb: 2 }} />
                    <TextField fullWidth label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required sx={{ mb: 2 }} />
                    <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 2 }} />
                    <TextField select fullWidth label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ mb: 4 }}>
                        <MenuItem value="user">Regular User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="superadmin">Superadmin</MenuItem>
                    </TextField>
                    <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} startIcon={<PersonAddIcon />}>
                        {loading ? 'Saving...' : 'Save User'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default AddUserPage;

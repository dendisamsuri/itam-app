import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, MenuItem } from '@mui/material';
import { PersonAddOutlined as PersonAddIcon } from '@mui/icons-material';
import { dataService } from '../utils/dataService';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';

function AddUserPage() {
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            await dataService.registerUser({
                name,
                department,
                username,
                email,
                password,
                role
            });

            setSuccess("User successfully added!");
            setName(''); setDepartment(''); setUsername(''); setEmail(''); setPassword(''); setRole('user');
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
        <PageContainer sx={{ maxWidth: 600, mx: 'auto' }}>
            <PageHeader
                title="Add New User"
                subtitle="Add a new user account to the IT Asset Management system."
                backPath="/employees"
            />
            <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleRegister}>
                    <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" sx={{ mb: 2 }} />
                    <TextField fullWidth label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ mb: 2 }} />
                    <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" sx={{ mb: 2 }} />
                    <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" sx={{ mb: 2 }} />
                    <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" sx={{ mb: 2 }} />
                    <TextField select fullWidth label="Role" value={role} onChange={(e) => setRole(e.target.value)} sx={{ mb: 4 }}>
                        <MenuItem value="user"> User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="superadmin">Superadmin</MenuItem>
                    </TextField>
                    <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} startIcon={<PersonAddIcon />}>
                        {loading ? 'Saving...' : 'Save User'}
                    </Button>
                </Box>
            </Paper>
        </PageContainer>
    );
}

export default AddUserPage;

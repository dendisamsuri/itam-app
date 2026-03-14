import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar, TablePagination, useTheme, useMediaQuery,
    Grid, Stack, Avatar, InputAdornment, IconButton, MenuItem
} from '@mui/material';
import {
    Person as PersonIcon,
    Business as BusinessIcon,
    Badge as BadgeIcon,
    LockReset as LockResetIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { getUserPayload } from '../utils/auth.js';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';
import { usePermissions } from '../PermissionsContext';

const isLocal = import.meta.env.VITE_APP_ENV === 'local';

function UserListPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { canWrite, userRole } = usePermissions();
    const isSuperAdmin = userRole === 'superadmin';
    const hasWriteAccess = canWrite('user_list') || isSuperAdmin;
    const hasAddAccess = canWrite('add_user') || isSuperAdmin;

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Reset Password Dialog State
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', department: '', email: '', role: 'user' });
    const [editLoading, setEditLoading] = useState(false);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await dataService.getUsers();
            setUsers(data || []);
        } catch (err) {
            console.error("fetchUsers error:", err);
            setError(err.message || 'Failed to fetch users.');
            const isAuthError = err?.response?.status === 401 || err?.status === 401 || err?.code === 'PGRST301' || err?.message?.toLowerCase().includes('jwt');
            if (isAuthError) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = () => {
        setSearchQuery(searchInput);
        setPage(0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Reset Password Handlers
    const handleResetClick = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setResetDialogOpen(true);
    };

    const handleResetConfirm = async () => {
        if (!newPassword) {
            setSnackbar({ open: true, message: 'Please enter a new password.', severity: 'error' });
            return;
        }

        try {
            setResetLoading(true);
            await dataService.resetPassword(selectedUser.id, newPassword);
            setSnackbar({ open: true, message: `Password for ${selectedUser.name} has been reset successfully!`, severity: 'success' });
            setResetDialogOpen(false);
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || err.message || 'Failed to reset password.', severity: 'error' });
        } finally {
            setResetLoading(false);
        }
    };

    // Edit Handlers
    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name || '',
            department: user.department || '',
            email: user.email || '',
            role: user.role || 'user'
        });
        setEditDialogOpen(true);
    };

    const handleEditConfirm = async () => {
        if (!editForm.name) {
            setSnackbar({ open: true, message: 'Nama harus diisi.', severity: 'error' });
            return;
        }

        try {
            setEditLoading(true);
            await dataService.updateUser(selectedUser.id, editForm);
            setSnackbar({ open: true, message: `User ${selectedUser.name} berhasil diupdate!`, severity: 'success' });
            setEditDialogOpen(false);
            fetchUsers();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || err.message || 'Failed to update user.', severity: 'error' });
        } finally {
            setEditLoading(false);
        }
    };

    // Delete Handlers
    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleteLoading(true);
            await dataService.deleteUser(selectedUser.id);
            setSnackbar({ open: true, message: `User ${selectedUser.name} berhasil dihapus.`, severity: 'success' });
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || err.message || 'Failed to delete user.', severity: 'error' });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredUsers = users.filter(user => {
        const lowerQuery = searchQuery.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(lowerQuery)) ||
            (user.username && user.username.toLowerCase().includes(lowerQuery)) ||
            (user.email && user.email.toLowerCase().includes(lowerQuery)) ||
            (user.department && user.department.toLowerCase().includes(lowerQuery)) ||
            (user.role && user.role.toLowerCase().includes(lowerQuery))
        );
    });

    const paginatedUsers = filteredUsers.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    }

    // Action buttons component for reuse
    const ActionButtons = ({ user, variant = 'icon' }) => {
        if (!hasWriteAccess) return null;

        if (variant === 'card') {
            return (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditClick(user)} color="primary" sx={{ borderRadius: '8px' }}>
                        Edit
                    </Button>
                    {isLocal && (
                        <Button size="small" startIcon={<LockResetIcon />} onClick={() => handleResetClick(user)} color="warning" sx={{ borderRadius: '8px' }}>
                            Reset
                        </Button>
                    )}
                    <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleDeleteClick(user)} color="error" sx={{ borderRadius: '8px' }}>
                        Delete
                    </Button>
                </Box>
            );
        }

        return (
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                <IconButton size="small" onClick={() => handleEditClick(user)} color="primary" title="Edit User">
                    <EditIcon fontSize="small" />
                </IconButton>
                {isLocal && (
                    <IconButton size="small" onClick={() => handleResetClick(user)} color="warning" title="Reset Password">
                        <LockResetIcon fontSize="small" />
                    </IconButton>
                )}
                <IconButton size="small" onClick={() => handleDeleteClick(user)} color="error" title="Delete User">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Stack>
        );
    };

    return (
        <PageContainer>
            <PageHeader
                title="User Management"
                subtitle={`Managing ${users.length} system users.`}
                action={
                    hasAddAccess ? (
                        <Button
                            variant="contained"
                            startIcon={<PersonIcon />}
                            onClick={() => navigate('/add-user')}
                        >
                            Add New User
                        </Button>
                    ) : null
                }
            />

            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Search by name, username, department, or role..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" fontSize="small" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px', bgcolor: 'background.paper' }
                    }}
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleSearch}
                    sx={{
                        borderRadius: '12px',
                        px: 3,
                        minWidth: 'fit-content',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                        }
                    }}
                >
                    {isMobile ? <SearchIcon fontSize="small" /> : 'Search'}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(0); }}
                    sx={{ borderRadius: '12px', px: 2, minWidth: 'fit-content' }}
                >
                    Reset
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
            )}

            {isMobile || isTablet ? (
                /* Mobile/Tablet: Card Layout */
                <Grid container spacing={2}>
                    {paginatedUsers.length === 0 ? (
                        <Grid size={12}>
                            <Paper sx={{ py: 10, textAlign: 'center', borderRadius: 4 }}>
                                <Typography color="text.secondary">No users found.</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        paginatedUsers.map((user) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={user.id}>
                                <Card sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)' }
                                }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar sx={{
                                                width: 42,
                                                height: 42,
                                                bgcolor: 'primary.lighter',
                                                color: 'primary.main',
                                                fontWeight: 700,
                                                mr: 2
                                            }}>
                                                {user.name ? user.name[0] : 'U'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {user.name || 'Unknown'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {user.email || (user.username ? `@${user.username}` : 'No email')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <BusinessIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {user.department || 'No Department'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <BadgeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                <Typography variant="body2" sx={{
                                                    color: user.role === 'superadmin' ? 'error.main' : user.role === 'admin' ? 'warning.main' : 'text.secondary',
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {user.role}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <ActionButtons user={user} variant="card" />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            ) : (
                /* Desktop: Table Layout */
                <Card sx={{ borderRadius: 4, overflow: 'hidden', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    {isLocal && <TableCell>Username</TableCell>}
                                    <TableCell>Email</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell>Role</TableCell>
                                    {hasWriteAccess && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={hasWriteAccess ? 6 : 5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedUsers.map((user) => (
                                        <TableRow key={user.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ py: 2, fontWeight: 600 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                                        {user.name ? user.name[0] : 'U'}
                                                    </Avatar>
                                                    {user.name}
                                                </Stack>
                                            </TableCell>
                                            {isLocal && <TableCell sx={{ py: 2 }}>{user.username}</TableCell>}
                                            <TableCell sx={{ py: 2 }}>{user.email || '-'}</TableCell>
                                            <TableCell sx={{ py: 2 }}>{user.department || '-'}</TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography variant="body2" sx={{
                                                    color: user.role === 'superadmin' ? 'error.main' : user.role === 'admin' ? 'warning.main' : 'text.primary',
                                                    fontWeight: user.role !== 'user' ? 700 : 400,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {user.role}
                                                </Typography>
                                            </TableCell>
                                            {hasWriteAccess && (
                                                <TableCell align="right" sx={{ py: 2 }}>
                                                    <ActionButtons user={user} variant="icon" />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            {filteredUsers.length > 0 && (
                <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            )}

            {/* Reset Password Dialog */}
            <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Are you sure you want to reset password for <strong>{selectedUser?.name}</strong>?
                    </Typography>
                    <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        autoFocus
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        variant="outlined"
                        placeholder="Enter new password"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setResetDialogOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleResetConfirm}
                        variant="contained"
                        color="warning"
                        disabled={resetLoading}
                        startIcon={resetLoading ? <CircularProgress size={20} /> : <LockResetIcon />}
                    >
                        Reset Password
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 700 }}>Edit User</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Editing user <strong>{selectedUser?.name}</strong>
                    </Typography>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Name *"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Department"
                            value={editForm.department}
                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                        <TextField
                            select
                            fullWidth
                            label="Role"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="superadmin">Superadmin</MenuItem>
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setEditDialogOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEditConfirm}
                        variant="contained"
                        color="primary"
                        disabled={editLoading}
                        startIcon={editLoading ? <CircularProgress size={20} /> : <EditIcon />}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete User</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        Are you sure you want to delete user <strong>{selectedUser?.name}</strong>?
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        This action will deactivate the user account. The data will not be permanently removed.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined" color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        Delete User
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default UserListPage;

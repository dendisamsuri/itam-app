import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar, TablePagination, useTheme, useMediaQuery
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const getTokenPayload = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user ? {
            id: user.id,
            role: user.user_metadata?.role || 'user',
            name: user.user_metadata?.name || 'User'
        } : null;
    } catch (e) {
        return null;
    }
};

function EmployeeListPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const isSuperAdmin = user?.role === 'superadmin';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        getTokenPayload().then(u => setUser(u));
    }, []);

    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [addFormData, setAddFormData] = useState({ name: '', department: '', email: '' });
    const [addError, setAddError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleOpenAddDialog = () => {
        setAddFormData({ name: '', department: '', email: '' });
        setAddError('');
        setOpenAddDialog(true);
    };

    const handleAddSubmit = async () => {
        if (!addFormData.name) {
            setAddError('Name is required');
            return;
        }
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                await apiLocal.post('/employees', {
                    name: addFormData.name,
                    department: addFormData.department || null,
                    email: addFormData.email || null
                });

                setSnackbar({ open: true, message: 'Employee added successfully!' });
                setOpenAddDialog(false);
                fetchEmployees();
            } else {
                const { error } = await supabase.from('employees').insert({
                    name: addFormData.name,
                    department: addFormData.department || null,
                    email: addFormData.email || null
                });
                if (error) throw error;

                setSnackbar({ open: true, message: 'Employee added successfully!' });
                setOpenAddDialog(false);
                fetchEmployees();
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setAddError(err.response.data.error);
            } else {
                setAddError(err.message || 'Failed to add employee');
            }
        }
    };

    const fetchEmployees = useCallback(async () => {
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const { data } = await apiLocal.get('/employees');
                setEmployees(data || []);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { navigate('/login'); return; }

                const { data, error: fetchErr } = await supabase
                    .from('employees')
                    .select('id, name, department, email')
                    .order('name', { ascending: true });

                if (fetchErr) throw fetchErr;
                setEmployees(data || []);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch employees.');
            if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedEmployees = employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    }

    return (
        <Box className="fade-in-up">
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Employee Directory
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                        A comprehensive list of all staff members and their respective departments.
                    </Typography>
                </Box>
                {(isSuperAdmin || isAdmin) && (
                    <Button variant="contained" size="large" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
                        Add New Employee
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
            )}

            <Card sx={{ borderRadius: 4, overflow: 'hidden', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Email Address</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No employees found. Employees are added automatically when an asset is assigned.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedEmployees.map((employee) => (
                                    <TableRow key={employee.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell sx={{ py: 2, fontWeight: 500 }}>{employee.name}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{employee.department || '-'}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{employee.email || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {employees.length > 0 && (
                    <TablePagination
                        component="div"
                        count={employees.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                )}
            </Card>

            {/* Add Employee Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Add Employee</DialogTitle>
                <DialogContent>
                    {addError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{addError}</Alert>}
                    <TextField
                        autoFocus fullWidth label="Name *" sx={{ mb: 2, mt: 1 }}
                        value={addFormData.name}
                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Department" sx={{ mb: 2 }}
                        value={addFormData.department}
                        onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Email" type="email"
                        value={addFormData.email}
                        onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenAddDialog(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleAddSubmit} variant="contained" startIcon={<AddIcon />}>
                        Add Employee
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default EmployeeListPage;

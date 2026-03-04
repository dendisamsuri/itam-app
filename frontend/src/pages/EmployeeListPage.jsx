import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar, TablePagination
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
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const isSuperAdmin = user?.role === 'superadmin';

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
            const { error } = await supabase.from('employees').insert({
                name: addFormData.name,
                department: addFormData.department || null,
                email: addFormData.email || null
            });
            if (error) throw error;

            setSnackbar({ open: true, message: 'Employee added successfully!' });
            setOpenAddDialog(false);
            fetchEmployees();
        } catch (err) {
            setAddError(err.message || 'Failed to add employee');
        }
    };

    const fetchEmployees = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }

            const { data, error: fetchErr } = await supabase
                .from('employees')
                .select('id, name, department, email')
                .order('name', { ascending: true });

            if (fetchErr) throw fetchErr;
            setEmployees(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch employees.');
            if (err.message?.includes('JWT')) navigate('/login');
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
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                        Employee List
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                        Manage and view all registered employees within the organization.
                    </Typography>
                </Box>
                {isSuperAdmin && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
                        Add Employee
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
            )}

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Department</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Email</TableCell>
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

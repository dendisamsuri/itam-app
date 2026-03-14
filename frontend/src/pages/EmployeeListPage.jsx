import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Snackbar, TablePagination, useTheme, useMediaQuery,
    Grid, Stack, Avatar, InputAdornment, IconButton
} from '@mui/material';
import {
    Add as AddIcon,
    Business as BusinessIcon,
    Email as EmailIcon,
    Edit as EditIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import { getUserPayload } from '../utils/auth.js';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';
import { usePermissions } from '../PermissionsContext';

function EmployeeListPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const { canWrite, userRole } = usePermissions();
    const isSuperAdmin = userRole === 'superadmin';
    const hasWriteAccess = canWrite('employee_list') || isSuperAdmin;

    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [addFormData, setAddFormData] = useState({ name: '', department: '', email: '' });
    const [addError, setAddError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: '', name: '', department: '', email: '' });
    const [editError, setEditError] = useState('');

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
            await dataService.createEmployee({
                name: addFormData.name,
                department: addFormData.department || null,
                email: addFormData.email || null
            });

            setSnackbar({ open: true, message: 'Employee added successfully!' });
            setOpenAddDialog(false);
            fetchEmployees();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setAddError(err.response.data.error);
            } else {
                setAddError(err.message || 'Failed to add employee');
            }
        }
    };

    const handleOpenEditDialog = (employee) => {
        setEditFormData({
            id: employee.id,
            name: employee.name,
            department: employee.department || '',
            email: employee.email || ''
        });
        setEditError('');
        setOpenEditDialog(true);
    };

    const handleEditSubmit = async () => {
        if (!editFormData.name) {
            setEditError('Name is required');
            return;
        }
        try {
            await dataService.updateEmployee(editFormData.id, {
                name: editFormData.name,
                department: editFormData.department || null,
                email: editFormData.email || null
            });

            setSnackbar({ open: true, message: 'Employee updated successfully!' });
            setOpenEditDialog(false);
            fetchEmployees();
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setEditError(err.response.data.error);
            } else {
                setEditError(err.message || 'Failed to update employee');
            }
        }
    };

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const { data, count } = await dataService.getEmployees({
                searchQuery,
                page,
                rowsPerPage
            });

            setEmployees(data || []);
            setTotalEmployees(count || 0);
        } catch (err) {
            setError(err.message || 'Failed to fetch employees.');
            if (err?.response?.status === 401 || err?.message?.includes('JWT') || err?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate, page, rowsPerPage, searchQuery]);

    const handleSearch = () => {
        setSearchQuery(searchInput);
        setPage(0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

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

    const filteredEmployees = employees;

    const paginatedEmployees = employees;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                <CircularProgress size={48} thickness={4} />
            </Box>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Employee Directory"
                subtitle={`${totalEmployees} staff members in the registry.`}
                action={
                    hasWriteAccess ? (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                        >
                            Add Employee
                        </Button>
                    ) : null
                }
            />

            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Search by name, email, or department..."
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
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
            )}

            {isMobile || isTablet ? (
                /* Mobile/Tablet: Card Layout */
                <Grid container spacing={2}>
                    {employees.length === 0 ? (
                        <Grid size={12}>
                            <Paper sx={{ py: 10, textAlign: 'center', borderRadius: 4 }}>
                                <Typography color="text.secondary">No employees found.</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        paginatedEmployees.map((employee) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={employee.id}>
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
                                                {employee.name ? employee.name[0] : 'U'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {employee.name || 'Unknown'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {employee.id ? String(employee.id).substring(0, 8) : 'N/A'}...
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <BusinessIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {employee.department || 'No Department'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <EmailIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                                                <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                                                    {employee.email || 'No Email'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        {hasWriteAccess && (
                                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleOpenEditDialog(employee)}
                                                    sx={{ borderRadius: '8px' }}
                                                >
                                                    Edit
                                                </Button>
                                            </Box>
                                        )}
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
                                    <TableCell>Department</TableCell>
                                    <TableCell>Email Address</TableCell>
                                    {hasWriteAccess && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={hasWriteAccess ? 4 : 3} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            No employees found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedEmployees.map((employee) => (
                                        <TableRow key={employee.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ py: 2, fontWeight: 600 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem', bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                                        {employee.name[0]}
                                                    </Avatar>
                                                    {employee.name}
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>{employee.department || '-'}</TableCell>
                                            <TableCell sx={{ py: 2 }}>{employee.email || '-'}</TableCell>
                                            {hasWriteAccess && (
                                                <TableCell align="right" sx={{ py: 2 }}>
                                                    <IconButton size="small" onClick={() => handleOpenEditDialog(employee)} color="primary">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
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

            {totalEmployees > 0 && (
                <TablePagination
                    component="div"
                    count={totalEmployees}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            )}

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

            {/* Edit Employee Dialog */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{ fontWeight: 700 }}>Edit Employee</DialogTitle>
                <DialogContent>
                    {editError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{editError}</Alert>}
                    <TextField
                        autoFocus fullWidth label="Name *" sx={{ mb: 2, mt: 1 }}
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Department" sx={{ mb: 2 }}
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    />
                    <TextField
                        fullWidth label="Email" type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenEditDialog(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleEditSubmit} variant="contained">
                        Save Changes
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
        </PageContainer>
    );
}

export default EmployeeListPage;

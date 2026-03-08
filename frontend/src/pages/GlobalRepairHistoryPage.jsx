import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, TextField, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Grid, Chip, TablePagination,
    useTheme, useMediaQuery, Stack, Divider
} from '@mui/material';
import { Search as SearchIcon, BuildOutlined as BuildIcon } from '@mui/icons-material';

const statusColor = (s) => {
    if (s === 'solved') return 'success';
    if (s === 'broken') return 'error';
    if (s === 'not solved' || s === 'need to service') return 'warning';
    return 'default';
};

function GlobalRepairHistoryPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchRepairs = useCallback(async () => {
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) return;

                const { data } = await apiLocal.get('/repairs');
                setRepairs(data || []);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { data, error } = await supabase
                    .from('repair_logs_view')
                    .select('*')
                    .order('repair_date', { ascending: false });

                if (error) throw error;
                setRepairs(data || []);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch global repair history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRepairs();
    }, [fetchRepairs]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, statusFilter, startDate, endDate]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredRepairs = useMemo(() => {
        return repairs.filter(log => {
            // Search
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || (
                (log.asset_name && log.asset_name.toLowerCase().includes(q)) ||
                (log.serial_number && log.serial_number.toLowerCase().includes(q)) ||
                (log.fault_description && log.fault_description.toLowerCase().includes(q)) ||
                (log.repair_details && log.repair_details.toLowerCase().includes(q))
            );

            // Status Filter
            const matchesStatus = !statusFilter || log.status === statusFilter;

            // Date Range Filter
            let matchesDate = true;
            if (startDate || endDate) {
                const logDate = new Date(log.repair_date || log.completion_date);
                // fallback to repair_date or whatever is present
                if (!isNaN(logDate)) {
                    if (startDate) {
                        const start = new Date(startDate);
                        start.setHours(0, 0, 0, 0);
                        if (logDate < start) matchesDate = false;
                    }
                    if (endDate) {
                        const end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                        if (logDate > end) matchesDate = false;
                    }
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [repairs, searchQuery, statusFilter, startDate, endDate]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedRepairs = useMemo(() => {
        return filteredRepairs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredRepairs, page, rowsPerPage]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    // Unique statuses for filter
    const statusOptions = [...new Set(repairs.map(r => r.status).filter(Boolean))];

    return (
        <Box className="fade-in-up">
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Global Repair History
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                    View and filter the complete timeline of all asset repairs across the organization.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: 'none' }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth size="small"
                                placeholder="Search asset, serial, or faults..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value=""><em>All Statuses</em></MenuItem>
                                    {statusOptions.map(st => (
                                        <MenuItem key={st} value={st}>{st}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                            <TextField
                                fullWidth size="small" type="date" label="Start"
                                InputLabelProps={{ shrink: true }}
                                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                            <TextField
                                fullWidth size="small" type="date" label="End"
                                InputLabelProps={{ shrink: true }}
                                value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {isMobile ? (
                <Grid container spacing={2}>
                    {filteredRepairs.length === 0 ? (
                        <Grid size={12}>
                            <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderRadius: 3 }}>
                                <BuildIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary">No repair records found</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        paginatedRepairs.map((repair) => (
                            <Grid size={12} key={repair.id}>
                                <Card variant="outlined" sx={{
                                    borderRadius: 3,
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                                }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box display="flex" justifyContent="space-between" mb={2} alignItems="flex-start">
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.2}>
                                                    {repair.asset_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', mt: 0.5, display: 'block' }}>
                                                    {repair.serial_number}
                                                </Typography>
                                            </Box>
                                            {repair.status && (
                                                <Chip
                                                    label={repair.status}
                                                    color={statusColor(repair.status)}
                                                    size="small"
                                                    sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                                                />
                                            )}
                                        </Box>

                                        <Typography variant="body2" fontWeight={600} gutterBottom sx={{ color: 'text.primary' }}>
                                            {repair.fault_description}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {repair.repair_details}
                                        </Typography>

                                        <Divider sx={{ my: 2, opacity: 0.6 }} />

                                        <Stack spacing={1.5}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</Typography>
                                                    <Typography variant="body2">{repair.action || '—'}</Typography>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor</Typography>
                                                    <Typography variant="body2">{repair.vendor || '—'}</Typography>
                                                </Box>
                                            </Box>

                                            <Typography variant="caption" color="text.secondary">
                                                Completed: <strong>{formatDate(repair.repair_date || repair.completion_date)}</strong>
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            ) : (
                <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: 'none' }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Asset</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Fault</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Action Taken</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Vendor</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRepairs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                            <BuildIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                                            No repair records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRepairs.map((repair) => (
                                        <TableRow key={repair.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={600}>{repair.asset_name}</Typography>
                                                <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                                    {repair.serial_number}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={500}>{repair.fault_description}</Typography>
                                                <Typography variant="caption" color="text.secondary">{repair.repair_details}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>{repair.action || '-'}</TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                {repair.status ? <Chip label={repair.status} color={statusColor(repair.status)} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} /> : '-'}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, whiteSpace: 'nowrap' }}>{formatDate(repair.repair_date || repair.completion_date)}</TableCell>
                                            <TableCell sx={{ py: 1.5 }}>{repair.vendor || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {filteredRepairs.length > 0 && (
                        <TablePagination
                            component="div"
                            count={filteredRepairs.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    )}
                </Card>
            )}
        </Box>
    );
}

export default GlobalRepairHistoryPage;

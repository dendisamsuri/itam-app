import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, TextField, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Grid, Chip, TablePagination
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const statusColor = (s) => {
    if (s === 'solved') return 'success';
    if (s === 'broken') return 'error';
    if (s === 'not solved' || s === 'need to service') return 'warning';
    return 'default';
};

function GlobalRepairHistoryPage() {
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
        return new Date(dateString).toLocaleDateString('id-ID');
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
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
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
                        <Grid size={{ xs: 12, md: 3 }}>
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
                        <Grid size={{ xs: 12, md: 2.5 }}>
                            <TextField
                                fullWidth size="small" type="date" label="Start Date"
                                InputLabelProps={{ shrink: true }}
                                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2.5 }}>
                            <TextField
                                fullWidth size="small" type="date" label="End Date"
                                InputLabelProps={{ shrink: true }}
                                value={endDate} onChange={(e) => setEndDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Asset</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Fault</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Action Taken</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Vendor</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRepairs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No repair records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRepairs.map((repair) => (
                                    <TableRow key={repair.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{repair.asset_name}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                                {repair.serial_number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{repair.fault_description}</Typography>
                                            <Typography variant="caption" color="text.secondary">{repair.repair_details}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>{repair.action || '-'}</TableCell>
                                        <TableCell sx={{ py: 2 }}>
                                            {repair.status ? <Chip label={repair.status} color={statusColor(repair.status)} size="small" /> : '-'}
                                        </TableCell>
                                        <TableCell sx={{ py: 2 }}>{formatDate(repair.repair_date || repair.completion_date)}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{repair.vendor || '-'}</TableCell>
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
        </Box>
    );
}

export default GlobalRepairHistoryPage;

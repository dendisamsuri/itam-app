import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, TextField, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Grid, TablePagination
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

function GlobalAssetHistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchHistory = useCallback(async () => {
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) return;

                const { data } = await apiLocal.get('/history');
                setHistory(data || []);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    return;
                }

                const { data, error } = await supabase
                    .from('asset_history_view')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setHistory(data || []);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch global asset history.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        setPage(0);
    }, [searchQuery, actionFilter, startDate, endDate]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filteredHistory = useMemo(() => {
        return history.filter(log => {
            // Search
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || (
                (log.asset_name && log.asset_name.toLowerCase().includes(q)) ||
                (log.serial_number && log.serial_number.toLowerCase().includes(q)) ||
                (log.from_user && log.from_user.toLowerCase().includes(q)) ||
                (log.to_user && log.to_user.toLowerCase().includes(q))
            );

            // Action Filter
            const matchesAction = !actionFilter || log.action_type === actionFilter;

            // Date Range Filter
            let matchesDate = true;
            if (startDate || endDate) {
                const logDate = new Date(log.created_at);
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

            return matchesSearch && matchesAction && matchesDate;
        });
    }, [history, searchQuery, actionFilter, startDate, endDate]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedHistory = useMemo(() => {
        return filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredHistory, page, rowsPerPage]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    // Unique actions for filter
    const actionOptions = [...new Set(history.map(h => h.action_type).filter(Boolean))];

    return (
        <Box className="fade-in-up">
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Global Asset History
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                    View and filter the complete timeline of all asset actions and handovers.
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
                                placeholder="Search asset, serial, or user..."
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
                                <InputLabel>Action Type</InputLabel>
                                <Select
                                    value={actionFilter}
                                    label="Action Type"
                                    onChange={(e) => setActionFilter(e.target.value)}
                                >
                                    <MenuItem value=""><em>All Actions</em></MenuItem>
                                    {actionOptions.map(action => (
                                        <MenuItem key={action} value={action}>{action}</MenuItem>
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
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Action</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>From User</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>To User</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Notes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No history records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedHistory.map((log) => (
                                    <TableRow key={log.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{log.asset_name}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                                {log.serial_number}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ py: 2, fontWeight: 500 }}>{log.action_type}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{formatDate(log.created_at)}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{log.from_user || '-'}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{log.to_user || '-'}</TableCell>
                                        <TableCell sx={{ py: 2 }}>{log.notes || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {filteredHistory.length > 0 && (
                    <TablePagination
                        component="div"
                        count={filteredHistory.length}
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

export default GlobalAssetHistoryPage;

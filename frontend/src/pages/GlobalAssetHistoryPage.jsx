import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, TextField, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Grid, TablePagination, useTheme, useMediaQuery,
    Card, CardContent, Divider, Chip, Stack
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

function GlobalAssetHistoryPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const fetchHistory = useCallback(async () => {
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) return;
                const { data } = await apiLocal.get('/history');
                setHistory(data || []);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;
                const { data, error } = await supabase.from('asset_history_view').select('*').order('created_at', { ascending: false });
                if (error) throw error;
                setHistory(data || []);
            }
        } catch (err) { setError(err.message || 'Failed to fetch global asset history.'); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);
    useEffect(() => { setPage(0); }, [searchQuery, actionFilter, startDate, endDate]);

    const filteredHistory = useMemo(() => {
        return history.filter(log => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || (log.asset_name?.toLowerCase().includes(q) || log.serial_number?.toLowerCase().includes(q) || log.from_user?.toLowerCase().includes(q) || log.to_user?.toLowerCase().includes(q));
            const matchesAction = !actionFilter || log.action_type === actionFilter;
            let matchesDate = true;
            if (startDate || endDate) {
                const logDate = new Date(log.created_at);
                if (startDate && logDate < new Date(startDate).setHours(0, 0, 0, 0)) matchesDate = false;
                if (endDate && logDate > new Date(endDate).setHours(23, 59, 59, 999)) matchesDate = false;
            }
            return matchesSearch && matchesAction && matchesDate;
        });
    }, [history, searchQuery, actionFilter, startDate, endDate]);

    const paginatedHistory = useMemo(() => filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredHistory, page, rowsPerPage]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    const actionOptions = [...new Set(history.map(h => h.action_type).filter(Boolean))];
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <Box>
            <Typography variant="h5" fontWeight={600} mb={3}>Asset History</Typography>
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField fullWidth size="small" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Action Type</InputLabel>
                            <Select value={actionFilter} label="Action Type" onChange={(e) => setActionFilter(e.target.value)}>
                                <MenuItem value=""><em>All</em></MenuItem>
                                {actionOptions.map(action => <MenuItem key={action} value={action}>{action}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                        <TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                        <TextField fullWidth size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </Grid>
                </Grid>
            </Paper>

            {isMobile ? (
                <Grid container spacing={2}>
                    {paginatedHistory.length === 0 ? (
                        <Grid size={12}>
                            <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderRadius: 3 }}>
                                <Typography color="text.secondary">No records found</Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        paginatedHistory.map((log) => (
                            <Grid size={12} key={log.id}>
                                <Card variant="outlined" sx={{
                                    borderRadius: 3,
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
                                }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box display="flex" justifyContent="space-between" mb={1.5} alignItems="flex-start">
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.2}>
                                                    {log.asset_name}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', mt: 0.5, display: 'block' }}>
                                                    {log.serial_number}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={log.action_type}
                                                color="primary"
                                                size="small"
                                                variant="soft"
                                                sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                                            />
                                        </Box>

                                        <Divider sx={{ my: 2, opacity: 0.6 }} />

                                        <Stack spacing={1.5}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</Typography>
                                                    <Typography variant="body2" fontWeight={600}>{log.from_user || '—'}</Typography>
                                                </Box>
                                                <Typography color="text.disabled">→</Typography>
                                                <Box textAlign="right">
                                                    <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</Typography>
                                                    <Typography variant="body2" fontWeight={600}>{log.to_user || '—'}</Typography>
                                                </Box>
                                            </Box>

                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="caption" color="text.secondary">{formatDate(log.created_at)}</Typography>
                                                {log.notes && (
                                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        "{log.notes}"
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            ) : (
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Asset</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Action</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>From</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>To</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 2 }}>Notes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedHistory.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>No records found</TableCell></TableRow>
                                ) : (
                                    paginatedHistory.map((log) => (
                                        <TableRow key={log.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={600}>{log.asset_name}</Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>{log.serial_number}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip label={log.action_type} color="primary" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, color: 'text.secondary' }}>{formatDate(log.created_at)}</TableCell>
                                            <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{log.from_user || '-'}</TableCell>
                                            <TableCell sx={{ py: 1.5, fontWeight: 500 }}>{log.to_user || '-'}</TableCell>
                                            <TableCell sx={{ py: 1.5, color: 'text.secondary', fontStyle: log.notes ? 'italic' : 'normal' }}>{log.notes || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {filteredHistory.length > 0 && (
                <TablePagination component="div" count={filteredHistory.length} page={page} onPageChange={(_, newP) => setPage(newP)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[15, 30, 50]} />
            )}
        </Box>
    );
}

export default GlobalAssetHistoryPage;
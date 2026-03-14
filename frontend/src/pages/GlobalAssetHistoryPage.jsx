import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, TextField, InputAdornment,
    FormControl, InputLabel, Select, MenuItem, Grid, TablePagination, useTheme, useMediaQuery,
    Card, CardContent, Divider, Chip, Stack, Button
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';

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

    const [tempSearchQuery, setTempSearchQuery] = useState('');
    const [tempActionFilter, setTempActionFilter] = useState('');
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');

    const [totalHistory, setTotalHistory] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) return;
                const { data } = await apiLocal.get('/api/history');
                setHistory(data || []);
                setTotalHistory(data?.length || 0);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                let query = supabase
                    .from('asset_history_view')
                    .select('*', { count: 'exact' });

                // Server-side filtering
                if (searchQuery && searchQuery.length >= 3) {
                    query = query.or(`asset_name.ilike.%${searchQuery}%,serial_number.ilike.%${searchQuery}%,from_user.ilike.%${searchQuery}%,to_user.ilike.%${searchQuery}%`);
                }
                if (actionFilter) {
                    query = query.eq('action_type', actionFilter);
                }
                if (startDate) {
                    query = query.gte('created_at', startDate);
                }
                if (endDate) {
                    query = query.lte('created_at', endDate + 'T23:59:59');
                }

                const from = page * rowsPerPage;
                const to = from + rowsPerPage - 1;

                const { data, error, count } = await query
                    .order('created_at', { ascending: false })
                    .range(from, to);

                if (error) throw error;
                setHistory(data || []);
                setTotalHistory(count || 0);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch global asset history.');
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, searchQuery, actionFilter, startDate, endDate]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);
    useEffect(() => { setPage(0); }, [searchQuery, actionFilter, startDate, endDate]);

    const handleApplyFilters = () => {
        if (tempSearchQuery && tempSearchQuery.length > 0 && tempSearchQuery.length < 3) return;
        setSearchQuery(tempSearchQuery);
        setActionFilter(tempActionFilter);
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setPage(0);
    };

    const handleClearFilters = () => {
        setTempSearchQuery('');
        setTempActionFilter('');
        setTempStartDate('');
        setTempEndDate('');
        setSearchQuery('');
        setActionFilter('');
        setStartDate('');
        setEndDate('');
        setPage(0);
    };

    const filteredHistory = useMemo(() => {
        if (import.meta.env.VITE_APP_ENV !== 'local') return history;

        return history.filter(h => {
            const matchesSearch = !searchQuery || searchQuery.length < 3 ||
                (h.asset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    h.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    h.from_user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    h.to_user?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesAction = !actionFilter || h.action_type === actionFilter;

            const matchesStartDate = !startDate || new Date(h.created_at) >= new Date(startDate);
            const matchesEndDate = !endDate || new Date(h.created_at) <= new Date(endDate + 'T23:59:59');

            return matchesSearch && matchesAction && matchesStartDate && matchesEndDate;
        });
    }, [history, searchQuery, actionFilter, startDate, endDate]);

    useEffect(() => {
        if (import.meta.env.VITE_APP_ENV === 'local') {
            setTotalHistory(filteredHistory.length);
        }
    }, [filteredHistory]);

    const paginatedHistory = useMemo(() => {
        if (import.meta.env.VITE_APP_ENV !== 'local') return history;
        const from = page * rowsPerPage;
        const to = from + rowsPerPage;
        return filteredHistory.slice(from, to);
    }, [filteredHistory, history, page, rowsPerPage]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    const actionOptions = [...new Set(history.map(h => h.action_type).filter(Boolean))];
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

    return (
        <PageContainer>
            <PageHeader
                title="Global Asset History"
                subtitle="Track all asset assignments and changes across the organization."
            />
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 2.5 }}>
                        <TextField fullWidth size="small" placeholder="Search..." value={tempSearchQuery} onChange={(e) => setTempSearchQuery(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()} />
                        {tempSearchQuery && tempSearchQuery.length > 0 && tempSearchQuery.length < 3 && (
                            <Typography variant="caption" color="error">Min. 3 characters</Typography>
                        )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                        <TextField
                            select
                            label="Action Type"
                            fullWidth
                            size="small"
                            value={tempActionFilter}
                            onChange={(e) => setTempActionFilter(e.target.value)}
                        >
                            <MenuItem value=""><em>All</em></MenuItem>
                            {actionOptions.map(action => <MenuItem key={action} value={action}>{action}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={tempStartDate} onChange={(e) => setTempStartDate(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
                        <TextField fullWidth size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }} value={tempEndDate} onChange={(e) => setTempEndDate(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 12, md: 2.5 }}>
                        <Stack direction="row" spacing={1}>
                            <Button variant="contained" onClick={handleApplyFilters} fullWidth disableElevation size="small">Search</Button>
                            <Button variant="outlined" onClick={handleClearFilters} size="small">Clear</Button>
                        </Stack>
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

            {totalHistory > 0 && (
                <TablePagination component="div" count={totalHistory} page={page} onPageChange={(_, newP) => setPage(newP)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[15, 30, 50]} />
            )}
        </PageContainer>
    );
}

export default GlobalAssetHistoryPage;
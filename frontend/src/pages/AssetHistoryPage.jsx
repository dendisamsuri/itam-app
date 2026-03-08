import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, CircularProgress, Alert,
    Chip, TextField, InputAdornment, MenuItem, Select, FormControl,
    InputLabel, Stack, TablePagination, IconButton, Tooltip,
    useTheme, useMediaQuery, Grid
} from '@mui/material';
import {
    Search as SearchIcon,
    ClearAll as ClearAllIcon,
    Inventory2Outlined as AssetIcon,
    SwapHoriz as TransferIcon,
    KeyboardReturn as ReturnIcon,
    Assignment as AssignIcon,
    Edit as EditIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';

const ACTION_CONFIG = {
    HANDOVER: { color: 'primary', label: 'Handover', icon: <TransferIcon sx={{ fontSize: 13 }} /> },
    RETURN: { color: 'success', label: 'Return', icon: <ReturnIcon sx={{ fontSize: 13 }} /> },
    ASSIGN: { color: 'info', label: 'Assign', icon: <AssignIcon sx={{ fontSize: 13 }} /> },
    UPDATE: { color: 'warning', label: 'Update', icon: <EditIcon sx={{ fontSize: 13 }} /> },
};

const getActionConfig = (type = '') => {
    const key = type.toUpperCase();
    return ACTION_CONFIG[key] || { color: 'default', label: type || 'Unknown', icon: null };
};

function StatCard({ label, value, color = 'text.primary' }) {
    return (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, flex: 1, minWidth: 90 }}>
            <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" fontWeight={800} color={color} lineHeight={1} mb={0.5}>
                    {value}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}
                    sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </Typography>
            </CardContent>
        </Card>
    );
}

function HistoryCard({ log, formatDate }) {
    const cfg = getActionConfig(log.action_type);
    return (
        <Card elevation={0} sx={{
            border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden',
            transition: 'box-shadow .15s', '&:hover': { boxShadow: 3 }
        }}>
            <Box sx={{ height: 3, bgcolor: `${cfg.color}.main` }} />
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={700} lineHeight={1.3}>
                            {log.asset_name || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                            {log.serial_number || ''}
                        </Typography>
                    </Box>
                    <Typography variant="caption" color="text.disabled" whiteSpace="nowrap" ml={1}>
                        {formatDate(log.created_at, true)}
                    </Typography>
                </Stack>

                <Box mb={1.25}>
                    <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small"
                        sx={{ fontWeight: 700, fontSize: '0.7rem', height: 24 }} />
                </Box>

                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box flex={1}>
                        <Typography variant="caption" color="text.disabled" fontWeight={600}
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>From</Typography>
                        <Typography variant="body2" fontWeight={600}>{log.from_user || '—'}</Typography>
                    </Box>
                    <Typography color="text.disabled">→</Typography>
                    <Box flex={1} textAlign="right">
                        <Typography variant="caption" color="text.disabled" fontWeight={600}
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>To</Typography>
                        <Typography variant="body2" fontWeight={600}>{log.to_user || '—'}</Typography>
                    </Box>
                </Stack>

                {log.notes && (
                    <Box sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 1, mt: 1.5 }}>
                        <Typography variant="caption" color="text.disabled" fontWeight={600}
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.25 }}>Notes</Typography>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">{log.notes}</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

export default function AssetHistoryPage() {
    const { id: assetId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                const { data } = await apiLocal.get(`/assets/${assetId}/history`);
                setAsset(data.asset);
                setHistory((data.history || []).map(h => ({
                    ...h,
                    asset_name: data.asset?.name,
                    serial_number: data.asset?.serial_number,
                })));
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { navigate('/login'); return; }

                // Get Asset Info
                const { data: assetData } = await supabase.from('assets').select('name, serial_number').eq('id', assetId).single();
                setAsset(assetData);

                const { data, error: err } = await supabase
                    .from('asset_history')
                    .select('id, action_type, from_user, to_user, notes, created_at')
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false });
                if (err) throw err;
                setHistory((data || []).map(h => ({
                    ...h,
                    asset_name: assetData?.name,
                    serial_number: assetData?.serial_number,
                })));
            }
        } catch (err) {
            setError(err.message || 'Gagal memuat data.');
            if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [assetId, navigate]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const formatDate = (ds, short = false) => {
        if (!ds) return '—';
        const d = new Date(ds);
        if (short) return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const filtered = history.filter(h => {
        const q = search.toLowerCase();
        const matchSearch = !q || [h.asset_name, h.serial_number, h.from_user, h.to_user, h.notes]
            .some(v => (v || '').toLowerCase().includes(q));
        const matchAction = !actionFilter || h.action_type?.toUpperCase() === actionFilter;
        const created = h.created_at ? new Date(h.created_at) : null;
        const matchStart = !startDate || (created && created >= new Date(startDate));
        const matchEnd = !endDate || (created && created <= new Date(endDate + 'T23:59:59'));
        return matchSearch && matchAction && matchStart && matchEnd;
    });

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const actionTypes = [...new Set(history.map(h => h.action_type?.toUpperCase()).filter(Boolean))];
    const hasFilter = search || actionFilter || startDate || endDate;

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress size={36} thickness={4} />
        </Box>
    );

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2.5, sm: 4 } }}>

            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                <Box sx={{ p: 0.875, bgcolor: 'primary.lighter', borderRadius: 2, display: 'flex' }}>
                    <HistoryIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                </Box>
                <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} letterSpacing="-0.02em">
                    Asset History
                </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Rekap seluruh aktivitas perpindahan dan perubahan aset
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

            {/* Stats */}
            <Stack direction="row" spacing={1.5} mb={3} sx={{ overflowX: 'auto', pb: 0.5 }}>
                <StatCard label="Total" value={history.length} color="text.primary" />
                <StatCard label="Handover" value={history.filter(h => h.action_type?.toUpperCase() === 'HANDOVER').length} color="primary.main" />
                <StatCard label="Return" value={history.filter(h => h.action_type?.toUpperCase() === 'RETURN').length} color="success.main" />
            </Stack>

            {/* Filter Bar */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 3 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField fullWidth size="small" placeholder="Cari aset, user, notes…"
                                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment>
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2.5 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Action</InputLabel>
                                <Select value={actionFilter} label="Action"
                                    onChange={e => { setActionFilter(e.target.value); setPage(0); }}
                                    sx={{ borderRadius: 2 }}>
                                    <MenuItem value="">Semua</MenuItem>
                                    {actionTypes.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <TextField fullWidth size="small" type="date" label="Dari" value={startDate}
                                onChange={e => { setStartDate(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                            <TextField fullWidth size="small" type="date" label="Sampai" value={endDate}
                                onChange={e => { setEndDate(e.target.value); setPage(0); }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </Grid>
                        {hasFilter && (
                            <Grid size={{ xs: 6, sm: "auto" }}>
                                <Tooltip title="Reset filter">
                                    <IconButton onClick={() => { setSearch(''); setActionFilter(''); setStartDate(''); setEndDate(''); setPage(0); }}
                                        size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                        <ClearAllIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        )}
                    </Grid>
                    {hasFilter && (
                        <Typography variant="caption" color="text.secondary" mt={1} display="block">
                            Menampilkan <strong>{filtered.length}</strong> dari {history.length} data
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* Desktop Table */}
            {!isMobile && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    {['Aset', 'Action', 'Tanggal', 'From', 'To', 'Notes'].map(col => (
                                        <TableCell key={col} sx={{
                                            fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase',
                                            letterSpacing: '0.06em', color: 'text.secondary', py: 1.5,
                                            borderBottom: '1px solid', borderColor: 'divider'
                                        }}>{col}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <AssetIcon sx={{ fontSize: 40, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                                            <Typography color="text.secondary" fontWeight={500}>Tidak ada data</Typography>
                                            <Typography variant="caption" color="text.disabled">Coba ubah filter pencarian</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : paginated.map(log => {
                                    const cfg = getActionConfig(log.action_type);
                                    return (
                                        <TableRow key={log.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
                                                    {log.asset_name || '—'}
                                                </Typography>
                                                <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                                                    {log.serial_number || ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small"
                                                    sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, color: 'text.secondary', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, fontWeight: 500, fontSize: '0.85rem' }}>
                                                {log.from_user || <span style={{ color: '#bbb' }}>—</span>}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5, fontWeight: 500, fontSize: '0.85rem' }}>
                                                {log.to_user || <span style={{ color: '#bbb' }}>—</span>}
                                            </TableCell>
                                            <TableCell sx={{
                                                py: 1.5, color: 'text.secondary', fontSize: '0.8rem',
                                                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                fontStyle: log.notes ? 'italic' : 'normal'
                                            }}>
                                                {log.notes || <span style={{ color: '#ddd' }}>—</span>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {filtered.length > 0 && (
                        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                            <TablePagination component="div" count={filtered.length} page={page}
                                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
                                rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage="Baris:"
                                sx={{ '& .MuiTablePagination-toolbar': { minHeight: 44 } }} />
                        </Box>
                    )}
                </Card>
            )}

            {/* Mobile Cards */}
            {isMobile && (
                <>
                    {filtered.length === 0 ? (
                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, py: 6, textAlign: 'center' }}>
                            <AssetIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.secondary" fontWeight={500}>Tidak ada data</Typography>
                        </Card>
                    ) : (
                        <>
                            <Stack spacing={1.5} mb={1}>
                                {paginated.map(log => <HistoryCard key={log.id} log={log} formatDate={formatDate} />)}
                            </Stack>
                            <TablePagination component="div" count={filtered.length} page={page}
                                onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
                                rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Baris:" />
                        </>
                    )}
                </>
            )}
        </Box>
    );
}
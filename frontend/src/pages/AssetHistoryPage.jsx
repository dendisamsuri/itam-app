import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, CircularProgress, Alert, Button, Divider, TablePagination
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

function AssetHistoryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const fetchHistory = useCallback(async () => {
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const { data } = await apiLocal.get(`/assets/${id}/history`);
                setAsset(data.asset);
                setHistory(data.history || []);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { navigate('/login'); return; }

                // Fetch asset details
                const { data: assetData, error: assetErr } = await supabase
                    .from('assets')
                    .select('id, name, serial_number')
                    .eq('id', id)
                    .single();

                if (assetErr) throw assetErr;
                setAsset(assetData);

                // Fetch history
                const { data: historyData, error: historyErr } = await supabase
                    .from('asset_history')
                    .select('id, action_type, from_user, to_user, notes, created_at')
                    .eq('asset_id', id)
                    .order('created_at', { ascending: false });

                if (historyErr) throw historyErr;
                setHistory(historyData || []);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch asset history.');
            if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedHistory = history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                <CircularProgress size={40} thickness={4} />
            </Box>
        );
    }

    return (
        <Box>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
                sx={{ mb: 3, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
            >
                Back to Asset List
            </Button>

            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                    Asset History
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
                    View the complete timeline of actions and handovers for this asset.
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
            )}

            {asset && (
                <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Asset Information</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Name</Typography>
                                <Typography variant="body1" fontWeight="600">{asset.name}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Serial Number</Typography>
                                <Typography variant="body1" fontWeight="600">{asset.serial_number}</Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            )}

            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Action</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>From User</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>To User</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', py: 2 }}>Notes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No history found for this asset.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedHistory.map((log) => (
                                    <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
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

                {history.length > 0 && (
                    <TablePagination
                        component="div"
                        count={history.length}
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

export default AssetHistoryPage;

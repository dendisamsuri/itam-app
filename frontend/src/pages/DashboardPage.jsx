import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Box, Typography, Paper, Grid, TextField, InputAdornment, Button, MenuItem, Stack, Card, CardContent, Skeleton,
    Chip, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, IconButton, TablePagination, Menu, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, Alert, Autocomplete, useTheme, useMediaQuery, Avatar
} from '@mui/material';
import {
    Add as AddIcon, Search as SearchIcon, QrCodeScanner as QrCodeScannerIcon,
    Person as PersonIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { getUserPayload } from '../utils/auth.js';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';
import { usePermissions } from '../PermissionsContext';

function DashboardPage() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [actionType, setActionType] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientDepartment, setRecipientDepartment] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [notes, setNotes] = useState('');
    const [returnTo, setReturnTo] = useState('IT');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');

    const [tempSearchQuery, setTempSearchQuery] = useState('');
    const [tempStatusFilter, setTempStatusFilter] = useState('');
    const [tempUserFilter, setTempUserFilter] = useState('');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuAsset, setMenuAsset] = useState(null);

    const { canWrite, userRole } = usePermissions();
    const [user, setUser] = useState(null);
    const isSuperAdmin = userRole === 'superadmin';
    const hasAssetWriteAccess = canWrite('asset_list') || isSuperAdmin;
    const hasAddAssetAccess = canWrite('add_asset') || isSuperAdmin;
    const [isScanning, setIsScanning] = useState(false);
    const [allAssets, setAllAssets] = useState([]);
    const [childAssets, setChildAssets] = useState([]);
    const [handoverPartOfId, setHandoverPartOfId] = useState('');
    
    useEffect(() => { getUserPayload().then(u => setUser(u)); }, []);

    const [totalCount, setTotalCount] = useState(0);

    const fetchAssets = useCallback(async () => {
        try {
            setLoading(true);
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                const { data } = await apiLocal.get('/api/assets');
                setAssets(data || []);
                setTotalCount(data?.length || 0);
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { navigate('/login'); return; }

                let query = supabase
                    .from('assets')
                    .select('id, serial_number, name, brand, model, photo_url, status, assigned_to, assigned_to_id, part_of_id', { count: 'exact' });

                // Server-side filtering
                if (searchQuery && searchQuery.length >= 3) {
                    query = query.or(`name.ilike.%${searchQuery}%,serial_number.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`);
                }
                if (statusFilter) {
                    query = query.eq('status', statusFilter);
                }
                if (userFilter) {
                    query = query.ilike('assigned_to', `%${userFilter}%`);
                }

                const from = page * rowsPerPage;
                const to = from + rowsPerPage - 1;

                const { data, error, count } = await query
                    .order('id', { ascending: false })
                    .range(from, to);

                if (error) throw error;

                // Optimasi Gambar: Gunakan transformasi Supabase jika ada photo_url
                const optimizedData = data.map(asset => {
                    if (asset.photo_url && asset.photo_url.includes('storage/v1/object/public')) {
                        // Asumsi menggunakan public bucket, tambahkan parameter transformasi
                        // Contoh URL: https://[project].supabase.co/storage/v1/object/public/assets/image.jpg
                        // Kita bisa menggunakan transform API jika diaktifkan di Supabase
                        // Namun cara termudah untuk preview adalah menambahkan query params jika didukung atau 
                        // menggunakan fetch with transform. Di sini kita asumsikan transformasi diaktifkan.
                        // asset.photo_url = `${asset.photo_url}?width=100&height=100&resize=contain`;
                    }
                    return asset;
                });

                setAssets(optimizedData || []);
                setTotalCount(count || 0);
            }
        } catch (err) {
            if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate, page, rowsPerPage, searchQuery, statusFilter, userFilter]);

    useEffect(() => { fetchAssets(); }, [fetchAssets]);

    useEffect(() => {
        let scanner = null;
        let timer = null;

        if (isScanning) {
            // Small delay to ensure the container "reader" is rendered and styled
            timer = setTimeout(() => {
                import('html5-qrcode').then((module) => {
                    const ScannerClass = module.Html5QrcodeScanner;
                    scanner = new ScannerClass("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
                    scanner.render((decodedText) => {
                        setSearchQuery(decodedText);
                        setIsScanning(false);
                        if (scanner) scanner.clear().catch(() => { });
                    }, () => { });
                }).catch(err => console.error(err));
            }, 100);
        }

        return () => {
            if (timer) clearTimeout(timer);
            if (scanner) scanner.clear().catch(() => { });
        };
    }, [isScanning]);

    useEffect(() => { setPage(0); }, [searchQuery, statusFilter, userFilter]);

    const handleApplyFilters = () => {
        if (tempSearchQuery && tempSearchQuery.length > 0 && tempSearchQuery.length < 3) {
            // Don't apply filters if search is too short, but we could show a hint
            return;
        }
        setSearchQuery(tempSearchQuery);
        setStatusFilter(tempStatusFilter);
        setUserFilter(tempUserFilter);
        setPage(0);
    };

    const handleClearFilters = () => {
        setTempSearchQuery('');
        setTempStatusFilter('');
        setTempUserFilter('');
        setSearchQuery('');
        setStatusFilter('');
        setUserFilter('');
        setPage(0);
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (autocompleteInputValue) {
                try {
                    if (import.meta.env.VITE_APP_ENV === 'local') {
                        const { data } = await apiLocal.get(`/api/employees/search?q=${encodeURIComponent(autocompleteInputValue)}`);
                        setEmployeeOptions(data || []);
                    } else {
                        const { data, error } = await supabase.from('employees').select('id, name, department, email').or(`name.ilike.%${autocompleteInputValue}%,email.ilike.%${autocompleteInputValue}%`).order('name');
                        if (!error) setEmployeeOptions(data || []);
                    }
                } catch { }
            } else { setEmployeeOptions([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [autocompleteInputValue]);

    const handleOpenDialog = async (asset, type) => {
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const { data } = await apiLocal.get(`/api/assets/${asset.id}`);
                setSelectedAsset(data);
            } else {
                const { data, error } = await supabase
                    .from('assets')
                    .select(`
            *,
            parent:part_of_id(id, name, serial_number, assigned_to)
          `)
                    .eq('id', asset.id)
                    .single();
                if (error) throw error;
                setSelectedAsset(data);
            }
        } catch (err) {
            console.error('Failed to fetch full asset details:', err);
            setSelectedAsset(asset);
        }

        setActionType(type); setOpen(true); setError(''); setNotes('');
        setRecipientName(''); setRecipientDepartment(''); setRecipientEmail(''); setAutocompleteInputValue('');
        setSelectedEmployee(null); setEmployeeOptions([]);
        setHandoverPartOfId(asset.part_of_id || '');
        setReturnTo('IT');

        if (type === 'HANDOVER') {
            try {
                if (import.meta.env.VITE_APP_ENV === 'local') {
                    const { data } = await apiLocal.get('/api/assets');
                    setAllAssets(data.filter(a => a.id !== asset.id));
                    
                    const childResp = await apiLocal.get(`/api/assets/${asset.id}/children`);
                    setChildAssets(childResp.data || []);
                } else {
                    const { data, error } = await supabase.from('assets').select('id, name, serial_number, brand, assigned_to, assigned_to_id').neq('id', asset.id);
                    if (!error) setAllAssets(data);
                    
                    const { data: childData } = await supabase.from('assets').select('id, name, brand, serial_number').eq('part_of_id', asset.id);
                    setChildAssets(childData || []);
                }
            } catch (err) { console.error('Failed to fetch assets for handover:', err); }
        }
    };

    const handleConfirmAction = async () => {
        const finalRecipientName = recipientName || autocompleteInputValue;
        if (actionType === 'HANDOVER') {
            if (!finalRecipientName) { setError('Recipient Name is required.'); return; }

            if (handoverPartOfId) {
                const parent = allAssets.find(a => a.id == handoverPartOfId);
                if (parent) {
                    if (!parent.assigned_to) {
                        setError(`Gagal: Aset induk (${parent.name}) belum diserahkan kepada siapapun. Silakan serahkan aset induk terlebih dahulu.`);
                        return;
                    }
                    // Check by name or ID
                    const recipientId = selectedEmployee?.id;
                    const parentOwnerId = parent.assigned_to_id;

                    if (recipientId && parentOwnerId) {
                        if (recipientId != parentOwnerId) {
                            setError(`Gagal: Penerima harus sama dengan pemegang aset induk (${parent.assigned_to}).`);
                            return;
                        }
                    } else if (finalRecipientName.toLowerCase().trim() !== parent.assigned_to.toLowerCase().trim()) {
                        setError(`Gagal: Penerima harus sama dengan pemegang aset induk (${parent.assigned_to}).`);
                        return;
                    }
                }
            }
        }
        setError('');
        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                await apiLocal.post(`/api/assets/${selectedAsset.id}/action`, {
                    action_type: actionType,
                    recipient_name: finalRecipientName,
                    recipient_department: recipientDepartment,
                    recipient_email: recipientEmail,
                    notes: notes,
                    part_of_id: handoverPartOfId || null,
                    return_to: actionType === 'RETURN' ? returnTo : null
                });
                fetchAssets(); setOpen(false);
            } else {
                let to_user_id = null, to_user_name = null;
                if (actionType === 'HANDOVER') {
                    to_user_name = finalRecipientName;
                    let { data: empData } = await supabase.from('employees').select('id').eq('name', to_user_name).maybeSingle();
                    if (empData) {
                        to_user_id = empData.id;
                        if (recipientDepartment || recipientEmail) await supabase.from('employees').update({ department: recipientDepartment || null, email: recipientEmail || null }).eq('id', to_user_id);
                    } else {
                        const { data: newEmp, error: insErr } = await supabase.from('employees').insert({ name: to_user_name, department: recipientDepartment || null, email: recipientEmail || null }).select().single();
                        if (insErr) throw insErr;
                        to_user_id = newEmp.id;
                    }
                }

                if (actionType === 'RETURN') {
                    if (!returnTo) throw new Error("Return to (IT/GA) is required.");
                    const settingKey = returnTo.toLowerCase() === 'it' ? 'it_user_id' : 'ga_user_id';
                    const { data: setRes, error: setErr } = await supabase.from('settings').select('value').eq('key', settingKey).maybeSingle();
                    if (setErr) throw setErr;
                    if (!setRes || !setRes.value) throw new Error(`User for ${returnTo} is not configured.`);

                    to_user_id = parseInt(setRes.value, 10);
                    const { data: empData, error: empErr } = await supabase.from('employees').select('name').eq('id', to_user_id).single();
                    if (empErr) throw empErr;
                    to_user_name = empData.name;
                }

                const status = actionType === 'HANDOVER' ? 'In Use' : 'Ready';
                await supabase.from('assets').update({ status, assigned_to: to_user_name, assigned_to_id: to_user_id, part_of_id: actionType === 'HANDOVER' ? (handoverPartOfId || null) : selectedAsset.part_of_id }).eq('id', selectedAsset.id);
                await supabase.from('asset_history').insert({ asset_id: selectedAsset.id, action_type: actionType, from_user: selectedAsset.assigned_to, to_user: to_user_name, notes, from_user_id: selectedAsset.assigned_to_id, to_user_id: to_user_id });
                fetchAssets(); setOpen(false);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'An error occurred.');
        }
    };

    const getStatusChip = (status) => {
        if (status === 'Ready') return <Chip label="Ready" color="success" size="small" variant="outlined" />;
        if (status === 'In Use') return <Chip label="In Use" color="warning" size="small" variant="outlined" />;
        return <Chip label={status || 'Unknown'} size="small" variant="outlined" />;
    };

    const handleMenuOpen = (e, asset) => { setAnchorEl(e.currentTarget); setMenuAsset(asset); };
    const handleMenuClose = () => { setAnchorEl(null); setMenuAsset(null); };
    const handleMenuAction = (type) => {
        if (type === 'DETAILS') navigate(`/assets/${menuAsset.id}/details`);
        else if (type === 'REPAIR') navigate(`/assets/${menuAsset.id}/repairs`);
        else if (type === 'HISTORY') navigate(`/assets/${menuAsset.id}/history`);
        else handleOpenDialog(menuAsset, type);
        handleMenuClose();
    };

    const filteredAssets = useMemo(() => {
        if (import.meta.env.VITE_APP_ENV !== 'local') return assets;

        return assets.filter(asset => {
            const matchesSearch = !searchQuery || searchQuery.length < 3 ||
                (asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    asset.brand?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = !statusFilter || asset.status === statusFilter;

            const matchesUser = !userFilter ||
                (asset.assigned_to?.toLowerCase().includes(userFilter.toLowerCase()));

            return matchesSearch && matchesStatus && matchesUser;
        });
    }, [assets, searchQuery, statusFilter, userFilter]);

    useEffect(() => {
        if (import.meta.env.VITE_APP_ENV === 'local') {
            setTotalCount(filteredAssets.length);
        }
    }, [filteredAssets]);

    const paginatedAssets = useMemo(() => {
        if (import.meta.env.VITE_APP_ENV !== 'local') return assets;
        const from = page * rowsPerPage;
        const to = from + rowsPerPage;
        return filteredAssets.slice(from, to);
    }, [filteredAssets, assets, page, rowsPerPage]);

    return (
        <PageContainer>
            <PageHeader
                title="IT Asset List"
                action={
                    hasAddAssetAccess ? (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/add')}
                            disableElevation
                        >
                            Add Asset
                        </Button>
                    ) : null
                }
            />

            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 2.5 }}>
                        <TextField
                            placeholder="Search assets..." fullWidth size="small" value={tempSearchQuery} onChange={(e) => setTempSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setIsScanning(!isScanning)} color={isScanning ? 'error' : 'primary'} size="small">
                                            <QrCodeScannerIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                        />
                        {tempSearchQuery && tempSearchQuery.length > 0 && tempSearchQuery.length < 3 && (
                            <Typography variant="caption" color="error">Min. 3 characters</Typography>
                        )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            value={tempStatusFilter}
                            onChange={(e) => setTempStatusFilter(e.target.value)}
                            SelectProps={{
                                displayEmpty: true,
                                renderValue: (value) => value || <Typography color="text.disabled">Status</Typography>
                            }}
                        >
                            <MenuItem value=""><em>Status</em></MenuItem>
                            <MenuItem value="Ready">Ready</MenuItem>
                            <MenuItem value="In Use">In Use</MenuItem>
                            <MenuItem value="Broken">Broken</MenuItem>
                            <MenuItem value="Need to service">Need to service</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                        <TextField placeholder="Filter by user..." fullWidth size="small" value={tempUserFilter} onChange={(e) => setTempUserFilter(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4.5 }}>
                        <Stack direction="row" spacing={1}>
                            <Button variant="contained" onClick={handleApplyFilters} fullWidth disableElevation size="small" sx={{ py: 1 }}>Apply</Button>
                            <Button variant="outlined" onClick={handleClearFilters} fullWidth size="small" sx={{ py: 1 }}>Clear</Button>
                        </Stack>
                    </Grid>
                </Grid>
                {isScanning && <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}><Box id="reader" sx={{ width: '100%', maxWidth: 400 }} /></Box>}
            </Paper>

            {isMobile || isTablet ? (
                <Grid container spacing={2}>
                    {loading ? [...Array(4)].map((_, i) => <Grid size={{ xs: 12, sm: 6 }} key={i}><Card variant="outlined"><CardContent><Skeleton height={30} /><Skeleton height={20} width="60%" /></CardContent></Card></Grid>) :
                        filteredAssets.length === 0 ? <Grid size={12}><Paper variant="outlined" sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">No assets found</Typography></Paper></Grid> :
                            paginatedAssets.map((asset) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={asset.id}>
                                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="subtitle1" fontWeight={600}>{asset.name}</Typography>
                                                {getStatusChip(asset.status)}
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" mb={1}>{asset.brand}</Typography>
                                            <Typography variant="body2" fontFamily="monospace" mb={1}>{asset.serial_number}</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{(asset.assigned_to || 'U')[0]}</Avatar>
                                                <Typography variant="body2">{asset.assigned_to || 'Available'}</Typography>
                                            </Box>
                                        </CardContent>
                                        <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                                            <Button size="small" variant="outlined" fullWidth onClick={() => navigate(`/assets/${asset.id}/details`)}>Details</Button>
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, asset)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}><MoreVertIcon fontSize="small" /></IconButton>
                                        </Box>
                                    </Card>
                                </Grid>
                            ))
                    }
                </Grid>
            ) : (
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell>Serial Number</TableCell>
                                    <TableCell>Asset Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Current User</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton height={40} /></TableCell></TableRow>) :
                                    filteredAssets.length === 0 ? <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No assets found</TableCell></TableRow> :
                                        paginatedAssets.map((asset) => (
                                            <TableRow key={asset.id} hover>
                                                <TableCell><Typography variant="body2" fontFamily="monospace">{asset.serial_number}</Typography></TableCell>
                                                <TableCell><Typography variant="body2" fontWeight={500}>{asset.name}</Typography><Typography variant="caption" color="text.secondary">{asset.brand}</Typography></TableCell>
                                                <TableCell>{getStatusChip(asset.status)}</TableCell>
                                                <TableCell>{asset.assigned_to || '—'}</TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, asset)}><MoreVertIcon fontSize="small" /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {!loading && totalCount > 0 && (
                <TablePagination component="div" count={totalCount} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
            )}

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {hasAssetWriteAccess && <MenuItem onClick={() => handleMenuAction('HANDOVER')}>Handover</MenuItem>}
                <MenuItem onClick={() => handleMenuAction('DETAILS')}>Asset Details</MenuItem>
                <MenuItem onClick={() => handleMenuAction('HISTORY')}>Asset History</MenuItem>
                <MenuItem onClick={() => handleMenuAction('REPAIR')}>Repair History</MenuItem>
                {hasAssetWriteAccess && <MenuItem onClick={() => handleMenuAction('RETURN')} disabled={menuAsset?.status === 'Ready'}>Return</MenuItem>}
            </Menu>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{actionType === 'HANDOVER' ? 'Handover Asset' : 'Return Asset'}</DialogTitle>
                <DialogContent dividers>
                    <DialogContentText sx={{ mb: 2 }}>Asset: <strong>{selectedAsset?.name} ({selectedAsset?.serial_number})</strong></DialogContentText>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {actionType === 'HANDOVER' && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                                    Part of (Parent Asset)
                                </Typography>
                                <Autocomplete
                                    size="small"
                                    options={allAssets}
                                    getOptionLabel={(option) => `${option.name} - ${option.brand} (${option.serial_number})`}
                                    value={allAssets.find(a => a.id == handoverPartOfId) || null}
                                    onChange={(event, newValue) => {
                                        setHandoverPartOfId(newValue ? newValue.id : '');
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder="Search parent asset..."
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    borderRadius: '8px',
                                                    bgcolor: 'transparent'
                                                }
                                            }}
                                        />
                                    )}
                                    sx={{ mb: 2 }}
                                />
                                {handoverPartOfId && (
                                    <Box sx={{ mt: 1, mb: 2, p: 1.5, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1.5, border: '1px solid rgba(25, 118, 210, 0.1)' }}>
                                        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                            CURRENT PARENT OWNER:
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {allAssets.find(a => a.id == handoverPartOfId)?.assigned_to || 'Not assigned yet'}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {childAssets && childAssets.length > 0 && (
                                    <Box sx={{ mt: 1, mb: 2, p: 1.5, bgcolor: 'rgba(237, 108, 2, 0.05)', borderRadius: 1.5, border: '1px solid rgba(237, 108, 2, 0.2)' }}>
                                        <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, mb: 1, display: 'block' }}>
                                            ASET TURUNAN (Ikut Diserahkan):
                                        </Typography>
                                        {childAssets.map(c => (
                                            <Box key={c.id} sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
                                                <Typography variant="body2" fontWeight={600}>• {c.name}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5, display: 'block' }}>
                                                    {c.brand} - SN: {c.serial_number}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                            <Autocomplete freeSolo options={employeeOptions} getOptionLabel={(o) => typeof o === 'string' ? o : o.name} value={selectedEmployee || recipientName} onInputChange={(_, v) => setAutocompleteInputValue(v)} onChange={(_, v) => { if (typeof v === 'object' && v !== null) { setSelectedEmployee(v); setRecipientName(v.name); setRecipientDepartment(v.department || ''); setRecipientEmail(v.email || ''); } else { setSelectedEmployee(null); setRecipientName(v || ''); } }} renderInput={(params) => <TextField {...params} autoFocus label="Recipient Name *" size="small" sx={{ mb: 2 }} />} />
                            <TextField fullWidth label="Department" size="small" value={recipientDepartment} onChange={(e) => setRecipientDepartment(e.target.value)} sx={{ mb: 2 }} />
                            <Autocomplete freeSolo options={employeeOptions} getOptionLabel={(o) => typeof o === 'string' ? o : o.email || ''} value={recipientEmail} onInputChange={(_, v) => setAutocompleteInputValue(v)} onChange={(_, v) => { if (typeof v === 'object' && v !== null) { setSelectedEmployee(v); setRecipientName(v.name); setRecipientDepartment(v.department || ''); setRecipientEmail(v.email || ''); } else { setRecipientEmail(v || ''); } }} renderInput={(params) => <TextField {...params} label="Email" size="small" type="email" sx={{ mb: 2 }} />} />
                        </>
                    )}
                    {actionType === 'RETURN' && (
                        <TextField
                            select
                            fullWidth
                            label="Return to"
                            size="small"
                            value={returnTo}
                            onChange={(e) => setReturnTo(e.target.value)}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="IT">IT</MenuItem>
                            <MenuItem value="GA">GA</MenuItem>
                        </TextField>
                    )}
                    <TextField fullWidth label="Notes (Optional)" size="small" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleConfirmAction} variant="contained" disableElevation>Confirm</Button>
                </DialogActions>
            </Dialog>
        </PageContainer>
    );
}

export default DashboardPage;
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment, Button, FormControl,
  InputLabel, Select, MenuItem, Stack, Card, CardContent, Skeleton, Divider,
  Chip, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, TablePagination, Menu, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Alert, Autocomplete, useTheme, useMediaQuery, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, QrCodeScanner as QrCodeScannerIcon,
  Person as PersonIcon, SearchOff as NoResultsIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { getUserPayload } from '../utils/auth.js';

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
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAsset, setMenuAsset] = useState(null);

  const [user, setUser] = useState(null);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => { getUserPayload().then(u => setUser(u)); }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      if (import.meta.env.VITE_APP_ENV === 'local') {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const { data } = await apiLocal.get('/assets');
        setAssets(data || []);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate('/login'); return; }
        const { data, error } = await supabase.from('assets').select('*').order('id', { ascending: false });
        if (error) throw error;
        setAssets(data || []);
      }
    } catch (err) {
      if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (autocompleteInputValue) {
        try {
          if (import.meta.env.VITE_APP_ENV === 'local') {
            const { data } = await apiLocal.get(`/employees/search?q=${encodeURIComponent(autocompleteInputValue)}`);
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

  const handleOpenDialog = (asset, type) => {
    setSelectedAsset(asset); setActionType(type); setOpen(true); setError(''); setNotes('');
    setRecipientName(''); setRecipientDepartment(''); setRecipientEmail(''); setAutocompleteInputValue('');
    setSelectedEmployee(null); setEmployeeOptions([]);
  };

  const handleConfirmAction = async () => {
    const finalRecipientName = recipientName || autocompleteInputValue;
    if (actionType === 'HANDOVER' && !finalRecipientName) { setError('Recipient Name is required.'); return; }
    setError('');
    try {
      if (import.meta.env.VITE_APP_ENV === 'local') {
        await apiLocal.post(`/assets/${selectedAsset.id}/action`, { action_type: actionType, recipient_name: finalRecipientName, recipient_department: recipientDepartment, recipient_email: recipientEmail, notes: notes });
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
        const status = actionType === 'HANDOVER' ? 'In Use' : 'Ready';
        await supabase.from('assets').update({ status, assigned_to: to_user_name, assigned_to_id: to_user_id }).eq('id', selectedAsset.id);
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
    return assets.filter(a => {
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || (a.name?.toLowerCase().includes(q) || a.serial_number?.toLowerCase().includes(q) || a.brand?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || a.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchUser = !userFilter || a.assigned_to?.toLowerCase().includes(userFilter.toLowerCase());
      return matchQuery && matchStatus && matchUser;
    });
  }, [assets, searchQuery, statusFilter, userFilter]);

  const paginatedAssets = useMemo(() => filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filteredAssets, page, rowsPerPage]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>IT Asset List</Typography>
        {(isSuperAdmin || isAdmin) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/add')} disableElevation>
            Add Asset
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              placeholder="Search assets..." fullWidth size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                <MenuItem value="Ready">Ready</MenuItem>
                <MenuItem value="In Use">In Use</MenuItem>
                <MenuItem value="Broken">Broken</MenuItem>
                <MenuItem value="Need to service">Need to service</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField placeholder="Filter by user..." fullWidth size="small" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} />
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

      {!loading && filteredAssets.length > 0 && (
        <TablePagination component="div" count={filteredAssets.length} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {(isSuperAdmin || isAdmin) && <MenuItem onClick={() => handleMenuAction('HANDOVER')}>Handover</MenuItem>}
        <MenuItem onClick={() => handleMenuAction('DETAILS')}>Asset Details</MenuItem>
        <MenuItem onClick={() => handleMenuAction('HISTORY')}>Asset History</MenuItem>
        <MenuItem onClick={() => handleMenuAction('REPAIR')}>Repair History</MenuItem>
        {(isSuperAdmin || isAdmin) && <MenuItem onClick={() => handleMenuAction('RETURN')} disabled={menuAsset?.status === 'Ready'}>Return</MenuItem>}
      </Menu>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{actionType === 'HANDOVER' ? 'Handover Asset' : 'Return Asset'}</DialogTitle>
        <DialogContent dividers>
          <DialogContentText sx={{ mb: 2 }}>Asset: <strong>{selectedAsset?.name} ({selectedAsset?.serial_number})</strong></DialogContentText>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {actionType === 'HANDOVER' && (
            <>
              <Autocomplete freeSolo options={employeeOptions} getOptionLabel={(o) => typeof o === 'string' ? o : o.name} value={selectedEmployee || recipientName} onInputChange={(_, v) => setAutocompleteInputValue(v)} onChange={(_, v) => { if (typeof v === 'object' && v !== null) { setSelectedEmployee(v); setRecipientName(v.name); setRecipientDepartment(v.department || ''); setRecipientEmail(v.email || ''); } else { setSelectedEmployee(null); setRecipientName(v || ''); } }} renderInput={(params) => <TextField {...params} autoFocus label="Recipient Name *" size="small" sx={{ mb: 2 }} />} />
              <TextField fullWidth label="Department" size="small" value={recipientDepartment} onChange={(e) => setRecipientDepartment(e.target.value)} sx={{ mb: 2 }} />
              <Autocomplete freeSolo options={employeeOptions} getOptionLabel={(o) => typeof o === 'string' ? o : o.email || ''} value={recipientEmail} onInputChange={(_, v) => setAutocompleteInputValue(v)} onChange={(_, v) => { if (typeof v === 'object' && v !== null) { setSelectedEmployee(v); setRecipientName(v.name); setRecipientDepartment(v.department || ''); setRecipientEmail(v.email || ''); } else { setRecipientEmail(v || ''); } }} renderInput={(params) => <TextField {...params} label="Email" size="small" type="email" sx={{ mb: 2 }} />} />
            </>
          )}
          <TextField fullWidth label="Notes (Optional)" size="small" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained" disableElevation>Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DashboardPage;
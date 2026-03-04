import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import {
  Box, Typography, Paper, Grid, TextField, InputAdornment, Button, FormControl,
  InputLabel, Select, MenuItem, Stack, Card, CardContent, Skeleton, Divider,
  CardActions, Chip, TableContainer, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, TablePagination, Menu, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Alert, Autocomplete, useTheme, useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, QrCodeScanner as QrCodeScannerIcon,
  Person as PersonIcon, SearchOff as NoResultsIcon, LocalOffer as TagIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const getTokenPayload = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      role: user.user_metadata?.role || 'user',
      name: user.user_metadata?.name || 'User'
    } : null;
  } catch (e) {
    return null;
  }
};

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Autocomplete
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [autocompleteInputValue, setAutocompleteInputValue] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Search & scanner
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Actions dropdown
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAsset, setMenuAsset] = useState(null);

  const [user, setUser] = useState(null);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getTokenPayload().then(u => setUser(u));
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      if (err.message?.includes('JWT')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  useEffect(() => {
    let scanner = null;
    if (isScanning) {
      // Dynamically import the scanner library only when needed
      import('html5-qrcode').then((module) => {
        const ScannerClass = module.Html5QrcodeScanner;
        scanner = new ScannerClass("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        scanner.render(
          (decodedText) => { setSearchQuery(decodedText); setIsScanning(false); scanner.clear(); },
          () => { }
        );
      }).catch(err => console.error("Failed to load QR scanner", err));
    }
    return () => { if (scanner) scanner.clear().catch(() => { }); };
  }, [isScanning]);

  useEffect(() => {
    // Reset page on filter changes
    setPage(0);
  }, [searchQuery, statusFilter, userFilter]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (autocompleteInputValue) {
        try {
          const { data, error } = await supabase
            .from('employees')
            .select('id, name, department, email')
            .ilike('name', `%${autocompleteInputValue}%`)
            .order('name');
          if (!error) setEmployeeOptions(data || []);
        } catch { }
      } else {
        setEmployeeOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [autocompleteInputValue]);

  const handleOpenDialog = (asset, type) => {
    setSelectedAsset(asset); setActionType(type); setOpen(true);
    setError(''); setNotes(''); setRecipientName(''); setRecipientDepartment('');
    setRecipientEmail(''); setAutocompleteInputValue('');
    setSelectedEmployee(null); setEmployeeOptions([]);
  };

  const handleCloseDialog = () => { setOpen(false); setSelectedAsset(null); };

  const handleConfirmAction = async () => {
    const finalRecipientName = recipientName || autocompleteInputValue;
    if (actionType === 'HANDOVER' && !finalRecipientName) {
      setError('Recipient Name is required for handover.'); return;
    }
    setError('');
    try {
      let to_user_id = null;
      let to_user_name = null;

      if (actionType === 'HANDOVER') {
        to_user_name = finalRecipientName;
        // Check if employee exists
        let { data: empData } = await supabase.from('employees')
          .select('id')
          .eq('name', to_user_name)
          .maybeSingle();

        if (empData) {
          to_user_id = empData.id;
          if (recipientDepartment || recipientEmail) {
            await supabase.from('employees').update({
              department: recipientDepartment || null,
              email: recipientEmail || null
            }).eq('id', to_user_id);
          }
        } else {
          const { data: newEmp, error: insErr } = await supabase.from('employees')
            .insert({
              name: to_user_name,
              department: recipientDepartment || null,
              email: recipientEmail || null
            }).select().single();
          if (insErr) throw insErr;
          to_user_id = newEmp.id;
        }
      }

      const status = actionType === 'HANDOVER' ? 'In Use' : 'Ready';

      // Update asset
      const { error: updErr } = await supabase.from('assets').update({
        status,
        assigned_to: to_user_name,
        assigned_to_id: to_user_id
      }).eq('id', selectedAsset.id);
      if (updErr) throw updErr;

      // Log history
      await supabase.from('asset_history').insert({
        asset_id: selectedAsset.id,
        action_type: actionType,
        from_user: selectedAsset.assigned_to,
        to_user: to_user_name,
        notes,
        from_user_id: selectedAsset.assigned_to_id,
        to_user_id: to_user_id
      });

      fetchAssets();
      handleCloseDialog();
    } catch (err) {
      setError(err.message || 'An error occurred.');
    }
  };

  const getStatusChip = (status) => {
    if (status === 'Ready') return <Chip label="Ready" color="success" size="small" />;
    if (status === 'In Use') return <Chip label="In Use" color="warning" size="small" />;
    return <Chip label={status} size="small" />;
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
    let result = assets;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.serial_number && a.serial_number.toLowerCase().includes(q)) ||
        (a.brand && a.brand.toLowerCase().includes(q))
      );
    }

    if (statusFilter) {
      result = result.filter(a => (a.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    if (userFilter) {
      result = result.filter(a => (a.assigned_to || '').toLowerCase().includes(userFilter.toLowerCase()));
    }

    return result;
  }, [assets, searchQuery, statusFilter, userFilter]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAssets = useMemo(() => {
    return filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredAssets, page, rowsPerPage]);

  // Skeleton loader rows
  const SkeletonRows = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
        </TableRow>
      ))}
    </>
  );

  return (
    <Box className="fade-in-up">
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            IT Asset List
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {filteredAssets.length} assets found
          </Typography>
        </Box>
        {(!isMobile && (isSuperAdmin || isAdmin)) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add')}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add Asset
          </Button>
        )}
      </Box>

      {/* Search Bar & Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                placeholder="Search name, brand, or serial number..."
                fullWidth size="small"
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
              <Button
                variant={isScanning ? 'contained' : 'outlined'}
                color={isScanning ? 'error' : 'primary'}
                startIcon={<QrCodeScannerIcon />}
                onClick={() => setIsScanning(!isScanning)}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                size="small"
              >
                {isScanning ? 'Cancel' : 'Scan'}
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value=""><em>All Statuses</em></MenuItem>
                <MenuItem value="Ready">Ready</MenuItem>
                <MenuItem value="In Use">In Use</MenuItem>
                <MenuItem value="Broken">Broken</MenuItem>
                <MenuItem value="Need to service">Need to service</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <TextField
              placeholder="Filter by Assigned User..."
              fullWidth size="small"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
        {isScanning && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Box id="reader" sx={{ width: '100%', maxWidth: 480 }} />
          </Box>
        )}
      </Paper>

      {/* Mobile: Cards */}
      {isMobile ? (
        <Stack spacing={1.5}>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
              </Card>
            ))
          ) : filteredAssets.length === 0 ? (
            <Paper sx={{ py: 6, textAlign: 'center' }}>
              <NoResultsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No assets found</Typography>
            </Paper>
          ) : (
            paginatedAssets.map((asset) => (
              <Card key={asset.id} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.3}>
                        {asset.name} {asset.brand}
                      </Typography>
                    </Box>
                    {getStatusChip(asset.status)}
                  </Box>
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <TagIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                        {asset.serial_number}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <PersonIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {asset.assigned_to || 'No User Assigned'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions sx={{ px: 2, py: 1, justifyContent: 'flex-end' }}>
                  {(isSuperAdmin || isAdmin) && (
                    <>
                      <Button
                        size="small" variant="outlined"
                        onClick={() => handleOpenDialog(asset, 'HANDOVER')}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Handover
                      </Button>
                      <Button
                        size="small" variant="outlined"
                        disabled={asset.status === 'Ready'}
                        onClick={() => handleOpenDialog(asset, 'RETURN')}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Return
                      </Button>
                    </>
                  )}
                  <Button
                    size="small"
                    onClick={() => navigate(`/assets/${asset.id}/details`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/assets/${asset.id}/history`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    History
                  </Button>
                  <Button
                    size="small"
                    onClick={() => navigate(`/assets/${asset.id}/repairs`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Repairs
                  </Button>
                </CardActions>
              </Card>
            ))
          )}
        </Stack>
      ) : (
        /* Desktop: Table */
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Asset Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current User</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <SkeletonRows /> : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 6, textAlign: 'center' }}>
                      <NoResultsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No assets found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={500} color="text.secondary">
                          {asset.serial_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{asset.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{asset.brand}</Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(asset.status)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={asset.assigned_to ? 'text.primary' : 'text.disabled'}>
                          {asset.assigned_to || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, asset)}
                          sx={{ bgcolor: '#f8fafc', '&:hover': { bgcolor: '#ede9fe' } }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination component outside view switching for consistent UI */}
      {!loading && filteredAssets.length > 0 && (
        <TablePagination
          component="div"
          count={filteredAssets.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* Actions Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 160 } }}
      >
        {(isSuperAdmin || isAdmin) && (
          <MenuItem onClick={() => handleMenuAction('HANDOVER')}>
            Handover
          </MenuItem>
        )}
        <MenuItem onClick={() => handleMenuAction('DETAILS')}>
          Asset Details
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('HISTORY')}>
          Asset History
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('REPAIR')}>
          Repair History
        </MenuItem>
        {(isSuperAdmin || isAdmin) && (
          <MenuItem onClick={() => handleMenuAction('RETURN')} disabled={menuAsset?.status === 'Ready'}>
            Return
          </MenuItem>
        )}
      </Menu>

      {/* Handover/Return Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="sm"
        PaperProps={{ sx: { mx: { xs: 1, sm: 'auto' } } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {actionType === 'HANDOVER' ? '📤 Handover Asset' : '📥 Return Asset'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2, fontSize: '0.9rem' }}>
            Asset: <strong>{selectedAsset?.name} — {selectedAsset?.serial_number}</strong>
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          {actionType === 'HANDOVER' && (
            <>
              <Autocomplete
                freeSolo id="recipient-autocomplete"
                options={employeeOptions}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.name}
                value={selectedEmployee || recipientName}
                onInputChange={(_, v) => setAutocompleteInputValue(v)}
                onChange={(_, v) => {
                  if (typeof v === 'object' && v !== null) {
                    setSelectedEmployee(v); setRecipientName(v.name);
                    setRecipientDepartment(v.department || ''); setRecipientEmail(v.email || '');
                  } else { setSelectedEmployee(null); setRecipientName(v || ''); }
                }}
                renderInput={(params) => (
                  <TextField {...params} autoFocus label="Recipient Name *" sx={{ mb: 2 }} />
                )}
              />
              <TextField fullWidth label="Department" value={recipientDepartment}
                onChange={(e) => setRecipientDepartment(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" type="email" value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)} sx={{ mb: 2 }} />
            </>
          )}
          <TextField fullWidth label="Notes (Optional)" value={notes}
            onChange={(e) => setNotes(e.target.value)} multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmAction} variant="contained">
            Confirm {actionType === 'HANDOVER' ? 'Handover' : 'Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DashboardPage;

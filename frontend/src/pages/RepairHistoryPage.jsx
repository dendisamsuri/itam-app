import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Box, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField, Alert,
  Select, MenuItem, FormControl, InputLabel,
  Card, CardContent, Chip, Divider, Skeleton, Stack,
  useMediaQuery, useTheme, Grid, IconButton, Snackbar, TablePagination
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  BuildOutlined as BuildIcon,
  Add as AddIcon,
  CalendarTodayOutlined as CalendarIcon,
  StorefrontOutlined as VendorIcon
} from '@mui/icons-material';

const statusOptions = ['solved', 'not solved', 'broken', 'need to service'];

const statusColor = (s) => {
  if (s === 'solved') return 'success';
  if (s === 'broken') return 'error';
  if (s === 'not solved' || s === 'need to service') return 'warning';
  return 'default';
};

function RepairHistoryPage() {
  const { id: assetId } = useParams();
  const [repairs, setRepairs] = useState([]);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fault_description: '', repair_details: '', completion_date: '',
    action: '', status: '', vendor: ''
  });
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchRepairHistory = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      // Fetch asset
      const { data: assetData, error: assetErr } = await supabase
        .from('assets')
        .select('id, name, serial_number')
        .eq('id', assetId)
        .single();
      if (assetErr) throw assetErr;
      setAsset(assetData);

      // Fetch repairs
      const { data: repairData, error: repairErr } = await supabase
        .from('repair_logs')
        .select('*')
        .eq('asset_id', assetId)
        .order('repair_date', { ascending: false });
      if (repairErr) throw repairErr;
      setRepairs(repairData || []);

    } catch (err) {
      setPageError(err.message || 'Failed to load repair history.');
      if (err.message?.includes('JWT')) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [assetId, navigate]);

  useEffect(() => { fetchRepairHistory(); }, [fetchRepairHistory]);

  const resetForm = () => setFormData({
    fault_description: '', repair_details: '', completion_date: '',
    action: '', status: '', vendor: ''
  });

  const handleOpenDialog = () => { resetForm(); setFormError(''); setOpen(true); };
  const handleCloseDialog = () => { setOpen(false); setFormError(''); };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRepairs = repairs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleAddRepair = async () => {
    if (!formData.fault_description || !formData.repair_details) {
      setFormError('Fault description and repair details are required.'); return;
    }
    setFormError('');
    try {
      const { error } = await supabase.from('repair_logs').insert({
        ...formData,
        asset_id: assetId,
        completion_date: formData.completion_date || null
      });
      if (error) throw error;

      if (formData.status === 'broken') {
        await supabase.from('assets').update({ status: 'Broken' }).eq('id', assetId);
      }

      handleCloseDialog();
      fetchRepairHistory();
      setSnackbar({ open: true, message: '✅ Repair log added successfully!' });
    } catch (err) {
      setFormError(err.message || 'An error occurred.');
    }
  };

  return (
    <Box className="fade-in-up">
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <IconButton
          onClick={() => navigate('/')}
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
            Repair History
          </Typography>
          {loading ? (
            <Skeleton width={200} height={20} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {asset?.name} · <code style={{ fontSize: '0.8em' }}>{asset?.serial_number}</code>
            </Typography>
          )}
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog} size={isMobile ? 'small' : 'medium'}>
          Add Record
        </Button>
      </Box>

      {pageError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{pageError}</Alert>}

      {/* Mobile: Cards */}
      {isMobile ? (
        <Stack spacing={1.5}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i}><CardContent>
                <Skeleton width="70%" height={24} /><Skeleton width="50%" /><Skeleton width="40%" />
              </CardContent></Card>
            ))
          ) : repairs.length === 0 ? (
            <Paper sx={{ py: 6, textAlign: 'center' }}>
              <BuildIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No repair history available</Typography>
            </Paper>
          ) : (
            paginatedRepairs.map((repair) => (
              <Card key={repair.id} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, mr: 1 }}>
                      {repair.fault_description}
                    </Typography>
                    {repair.status && (
                      <Chip label={repair.status} color={statusColor(repair.status)} size="small" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {repair.repair_details}
                  </Typography>
                  {repair.action && (
                    <Typography variant="caption" color="text.secondary">
                      Action: {repair.action}
                    </Typography>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    {repair.completion_date && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(repair.completion_date).toLocaleDateString('id-ID')}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {repair.vendor && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VendorIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{repair.vendor}</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
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
                  <TableCell>Fault Description</TableCell>
                  <TableCell>Repair Details</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Completion Date</TableCell>
                  <TableCell>Vendor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : repairs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                      <BuildIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No repair history available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRepairs.map((repair) => (
                    <TableRow key={repair.id}>
                      <TableCell><Typography variant="body2" fontWeight={500}>{repair.fault_description}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{repair.repair_details}</Typography></TableCell>
                      <TableCell>{repair.action || '—'}</TableCell>
                      <TableCell>
                        {repair.status
                          ? <Chip label={repair.status} color={statusColor(repair.status)} size="small" />
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {repair.completion_date
                          ? new Date(repair.completion_date).toLocaleDateString('id-ID')
                          : '—'}
                      </TableCell>
                      <TableCell>{repair.vendor || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination component outside view switching for consistent UI */}
      {!loading && repairs.length > 0 && (
        <TablePagination
          component="div"
          count={repairs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* Add Repair Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="sm"
        PaperProps={{ sx: { mx: { xs: 1, sm: 'auto' } } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>🔧 Add Repair Record</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <TextField autoFocus fullWidth name="fault_description" label="Fault Description *"
            value={formData.fault_description} onChange={handleInputChange} sx={{ mb: 2 }} />
          <TextField fullWidth name="repair_details" label="Repair Details *"
            value={formData.repair_details} onChange={handleInputChange} sx={{ mb: 2 }} />
          <TextField fullWidth name="action" label="Action"
            value={formData.action} onChange={handleInputChange} sx={{ mb: 2 }} />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="repair-status-label">Status</InputLabel>
            <Select labelId="repair-status-label" name="status" value={formData.status}
              onChange={handleInputChange} label="Status">
              <MenuItem value=""><em>— Select Status —</em></MenuItem>
              {statusOptions.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth name="completion_date" label="Completion Date" type="date"
            InputLabelProps={{ shrink: true }} value={formData.completion_date}
            onChange={handleInputChange} sx={{ mb: 2 }} />
          <TextField fullWidth name="vendor" label="Vendor"
            value={formData.vendor} onChange={handleInputChange} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button onClick={handleAddRepair} variant="contained" startIcon={<AddIcon />}>
            Add Record
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RepairHistoryPage;

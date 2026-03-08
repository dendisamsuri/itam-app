import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
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
  const [totalRepairs, setTotalRepairs] = useState(0);
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
      if (import.meta.env.VITE_APP_ENV === 'local') {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        const { data } = await apiLocal.get(`/assets/${assetId}/repairs`);
        setAsset(data.asset);
        setRepairs(data.repairs || []);
      } else {
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

        // Fetch repairs with pagination
        const from = page * rowsPerPage;
        const to = from + rowsPerPage - 1;

        const { data: repairData, error: repairErr, count } = await supabase
          .from('repair_logs')
          .select('*', { count: 'exact' })
          .eq('asset_id', assetId)
          .order('repair_date', { ascending: false })
          .range(from, to);

        if (repairErr) throw repairErr;
        setRepairs(repairData || []);
        setTotalRepairs(count || 0);
      }
    } catch (err) {
      setPageError(err.message || 'Failed to load repair history.');
      if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
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

  const paginatedRepairs = repairs;

  const handleAddRepair = async () => {
    if (!formData.fault_description || !formData.repair_details) {
      setFormError('Fault description and repair details are required.'); return;
    }
    setFormError('');
    try {
      if (import.meta.env.VITE_APP_ENV === 'local') {
        await apiLocal.post(`/assets/${assetId}/repairs`, {
          ...formData
        });

        handleCloseDialog();
        fetchRepairHistory();
        setSnackbar({ open: true, message: '✅ Repair log added successfully!' });
      } else {
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
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError(err.message || 'An error occurred.');
      }
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
        <Stack spacing={2}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} sx={{ borderRadius: 3, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent>
                  <Skeleton width="70%" height={24} sx={{ mb: 1 }} />
                  <Skeleton width="90%" sx={{ mb: 0.5 }} />
                  <Skeleton width="40%" />
                </CardContent>
              </Card>
            ))
          ) : repairs.length === 0 ? (
            <Paper variant="outlined" sx={{ py: 8, textAlign: 'center', borderRadius: 4, bgcolor: 'transparent', borderStyle: 'dashed' }}>
              <BuildIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
              <Typography color="text.secondary" fontWeight={500}>No repair history available</Typography>
            </Paper>
          ) : (
            paginatedRepairs.map((repair) => (
              <Card key={repair.id} sx={{
                borderRadius: 3,
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, mr: 1, color: 'text.primary', lineHeight: 1.3 }}>
                      {repair.fault_description}
                    </Typography>
                    {repair.status && (
                      <Chip
                        label={repair.status}
                        color={statusColor(repair.status)}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.65rem', height: 22 }}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                    {repair.repair_details}
                  </Typography>

                  {repair.action && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.5 }}>Action Taken</Typography>
                      <Typography variant="body2" color="text.primary">{repair.action}</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2, opacity: 0.6 }} />

                  <Grid container spacing={2}>
                    {repair.completion_date && (
                      <Grid size={6}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.2 }}>Date</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" fontWeight={600} color="text.primary">
                            {new Date(repair.completion_date).toLocaleDateString('id-ID')}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {repair.vendor && (
                      <Grid size={6}>
                        <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.2 }}>Vendor</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VendorIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          <Typography variant="caption" fontWeight={600} color="text.primary">{repair.vendor}</Typography>
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
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: 'none' }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Fault Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Repair Details</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Completion Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, py: 2 }}>Vendor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => <TableCell key={j} sx={{ py: 2 }}><Skeleton /></TableCell>)}
                    </TableRow>
                  ))
                ) : repairs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 10, textAlign: 'center' }}>
                      <BuildIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 2, display: 'block', mx: 'auto', opacity: 0.5 }} />
                      <Typography color="text.secondary" fontWeight={500}>No repair history available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRepairs.map((repair) => (
                    <TableRow key={repair.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ py: 2 }}><Typography variant="body2" fontWeight={600} color="text.primary">{repair.fault_description}</Typography></TableCell>
                      <TableCell sx={{ py: 2 }}><Typography variant="body2" color="text.secondary">{repair.repair_details}</Typography></TableCell>
                      <TableCell sx={{ py: 2 }}>{repair.action || '—'}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {repair.status
                          ? <Chip label={repair.status} color={statusColor(repair.status)} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                          : '—'}
                      </TableCell>
                      <TableCell sx={{ py: 2, whiteSpace: 'nowrap' }}>
                        {repair.completion_date
                          ? new Date(repair.completion_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>{repair.vendor || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Pagination component outside view switching for consistent UI */}
      {!loading && totalRepairs > 0 && (
        <TablePagination
          component="div"
          count={totalRepairs}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 1 }}
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

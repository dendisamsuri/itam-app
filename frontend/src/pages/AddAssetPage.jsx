import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
  Paper, Typography, TextField, Button, Box, Grid, Alert,
  InputAdornment, Snackbar, IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const fields = [
  { name: 'serial_number', label: 'Serial Number (SN)', required: true, xs: 12 },
  { name: 'name', label: 'Asset Name', required: true, xs: 12, sm: 4 },
  { name: 'brand', label: 'Brand', required: true, xs: 12, sm: 4 },
  { name: 'model', label: 'Model', xs: 12, sm: 4 },
  { name: 'photo_url', label: 'Photo URL', xs: 12 },
  { name: 'purchase_date', label: 'Purchase Date', type: 'date', xs: 12, sm: 6 },
  { name: 'warranty_expiry', label: 'Warranty Expiry', type: 'date', xs: 12, sm: 6 },
];

function AddAssetPage() {
  const [formData, setFormData] = useState({ serial_number: '', name: '', brand: '', model: '', specs: '', photo_url: '', purchase_date: '', warranty_expiry: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, photo_url: formData.photo_url || null, purchase_date: formData.purchase_date || null, warranty_expiry: formData.warranty_expiry || null };

      if (import.meta.env.VITE_APP_ENV === 'local') {
        await apiLocal.post('/assets', payload);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        payload.created_by = user.user_metadata?.name || 'User';
        payload.updated_by = payload.created_by;
        payload.status = 'Ready';
        const { error } = await supabase.from('assets').insert(payload);
        if (error) throw error;
      }
      setSnackbar({ open: true, message: `✅ Asset created successfully!`, severity: 'success' });
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setSnackbar({ open: true, message: `❌ ${error.response?.data?.error || error.message || 'Error'}`, severity: 'error' });
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/')} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>Add New Asset</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {fields.map((f) => (
                  <Grid size={{ xs: f.xs, sm: f.sm }} key={f.name}>
                    <TextField
                      required={f.required} fullWidth size="small" id={f.name} label={f.label} name={f.name} type={f.type || 'text'}
                      value={formData[f.name]} onChange={handleInputChange}
                      InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                      InputProps={f.name === 'serial_number' ? { startAdornment: <InputAdornment position="start">SN</InputAdornment> } : undefined}
                    />
                  </Grid>
                ))}
                <Grid size={12}>
                  <TextField fullWidth size="small" multiline rows={3} label="Specifications" name="specs" value={formData.specs} onChange={handleInputChange} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="submit" variant="contained" disableElevation disabled={loading} sx={{ minWidth: 150 }}>
                  {loading ? 'Saving...' : 'Save Asset'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Barcode Preview</Typography>
            {formData.serial_number ? (
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                <Barcode value={formData.serial_number} format="CODE128" height={60} width={1.5} fontSize={14} />
              </Box>
            ) : (
              <Box sx={{ py: 6, bgcolor: '#f8fafc', borderRadius: 1, border: '1px dashed #cbd5e1', color: 'text.secondary' }}>
                <Typography variant="body2">Enter SN to generate barcode</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default AddAssetPage;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
  Paper, Typography, TextField, Button, Box, Grid, Alert,
  Divider, InputAdornment, Snackbar
} from '@mui/material';
import {
  QrCode2 as BarcodeIcon,
  SaveOutlined as SaveIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';

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
      if (import.meta.env.VITE_APP_ENV === 'local') {
        const payload = {
          serial_number: formData.serial_number,
          name: formData.name,
          brand: formData.brand,
          model: formData.model,
          specs: formData.specs,
          photo_url: formData.photo_url || null,
          purchase_date: formData.purchase_date || null,
          warranty_expiry: formData.warranty_expiry || null
        };
        await apiLocal.post('/assets', payload);

        setSnackbar({ open: true, message: `✅ Asset created successfully!`, severity: 'success' });
        setFormData({ serial_number: '', name: '', brand: '', model: '', specs: '', photo_url: '', purchase_date: '', warranty_expiry: '' });
        setTimeout(() => navigate('/'), 2000);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const createdBy = user.user_metadata?.name || 'User';

        const payload = {
          serial_number: formData.serial_number,
          name: formData.name,
          brand: formData.brand,
          model: formData.model,
          specs: formData.specs,
          photo_url: formData.photo_url || null,
          purchase_date: formData.purchase_date || null,
          warranty_expiry: formData.warranty_expiry || null,
          created_by: createdBy,
          updated_by: createdBy,
          status: 'Ready'
        };

        const { data, error } = await supabase.from('assets').insert(payload).select().single();
        if (error) throw error;

        setSnackbar({ open: true, message: `✅ Asset created successfully!`, severity: 'success' });
        setFormData({ serial_number: '', name: '', brand: '', model: '', specs: '', photo_url: '', purchase_date: '', warranty_expiry: '' });
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setSnackbar({ open: true, message: `❌ ${error.response.data.error}`, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: `❌ ${error.message || 'Unknown error'}`, severity: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="fade-in-up">
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Add New Asset
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Register a new IT asset into the system
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Form Card */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <InventoryIcon sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Asset Information</Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                {fields.map((f) => (
                  <Grid size={{ xs: f.xs, sm: f.sm }} key={f.name}>
                    <TextField
                      required={f.required}
                      fullWidth
                      id={f.name}
                      label={f.label}
                      name={f.name}
                      type={f.type || 'text'}
                      value={formData[f.name]}
                      onChange={handleInputChange}
                      InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                      InputProps={f.name === 'serial_number' ? {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>SN</Typography>
                          </InputAdornment>
                        ),
                      } : undefined}
                    />
                  </Grid>
                ))}
                <Grid size={12}>
                  <TextField
                    fullWidth multiline rows={3}
                    id="specs" label="Specifications (e.g., Core i5, 16GB RAM)"
                    name="specs" value={formData.specs} onChange={handleInputChange}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading}
                startIcon={<SaveIcon />}
                sx={{ mt: 3, py: 1.4, fontSize: '1rem' }}
              >
                {loading ? 'Saving...' : 'Save Asset'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Barcode Preview Card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2,
                background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <BarcodeIcon sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Barcode Preview</Typography>
            </Box>
            <Divider sx={{ mb: 2.5 }} />

            {formData.serial_number ? (
              <Box sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '2px dashed #e2e8f0'
              }}>
                <Barcode value={formData.serial_number} format="CODE128" height={60} fontSize={13} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  {formData.serial_number}
                </Typography>
              </Box>
            ) : (
              <Box sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', py: 6,
                bgcolor: '#f8fafc', borderRadius: 3, border: '2px dashed #e2e8f0',
                color: 'text.disabled'
              }}>
                <BarcodeIcon sx={{ fontSize: 48, mb: 1.5 }} />
                <Typography variant="body2" textAlign="center">
                  Enter Serial Number<br />to view barcode
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AddAssetPage;

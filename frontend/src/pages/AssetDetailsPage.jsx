import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Paper, Typography, TextField, Button, Box, Grid, Alert,
    Divider, InputAdornment, Skeleton, Snackbar, IconButton
} from '@mui/material';
import {
    Save as SaveIcon,
    Inventory2Outlined as InventoryIcon,
    QrCodeScanner as BarcodeIcon,
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';

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

const fields = [
    { name: 'serial_number', label: 'Serial Number (SN)', required: true, xs: 12 },
    { name: 'name', label: 'Asset Name', required: true, xs: 12, sm: 4 },
    { name: 'brand', label: 'Brand', required: true, xs: 12, sm: 4 },
    { name: 'model', label: 'Model', xs: 12, sm: 4 },
    { name: 'photo_url', label: 'Photo URL', xs: 12 },
    { name: 'purchase_date', label: 'Purchase Date', type: 'date', xs: 12, sm: 6 },
    { name: 'warranty_expiry', label: 'Warranty Expiry', type: 'date', xs: 12, sm: 6 },
];

function AssetDetailsPage() {
    const { id: assetId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        serial_number: '', name: '', brand: '', model: '', specs: '',
        photo_url: '', purchase_date: '', warranty_expiry: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isEditing, setIsEditing] = useState(false);

    const [user, setUser] = useState(null);
    const isSuperAdmin = user?.role === 'superadmin';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        getTokenPayload().then(u => setUser(u));
    }, []);

    const fetchAssetDetails = useCallback(async () => {
        try {
            setLoading(true);
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }

                const { data: asset } = await apiLocal.get(`/assets/${assetId}`);

                // Format dates for input type="date"
                if (asset.purchase_date) asset.purchase_date = asset.purchase_date.split('T')[0];
                if (asset.warranty_expiry) asset.warranty_expiry = asset.warranty_expiry.split('T')[0];

                setFormData({
                    serial_number: asset.serial_number || '',
                    name: asset.name || '',
                    brand: asset.brand || '',
                    model: asset.model || '',
                    specs: asset.specs || '',
                    photo_url: asset.photo_url || '',
                    purchase_date: asset.purchase_date || '',
                    warranty_expiry: asset.warranty_expiry || ''
                });
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { navigate('/login'); return; }

                const { data: asset, error: fetchErr } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('id', assetId)
                    .single();

                if (fetchErr) throw fetchErr;

                // Format dates for input type="date"
                if (asset.purchase_date) asset.purchase_date = asset.purchase_date.split('T')[0];
                if (asset.warranty_expiry) asset.warranty_expiry = asset.warranty_expiry.split('T')[0];

                setFormData({
                    serial_number: asset.serial_number || '',
                    name: asset.name || '',
                    brand: asset.brand || '',
                    model: asset.model || '',
                    specs: asset.specs || '',
                    photo_url: asset.photo_url || '',
                    purchase_date: asset.purchase_date || '',
                    warranty_expiry: asset.warranty_expiry || ''
                });
            }
        } catch (err) {
            setError(err.message || 'Failed to load asset details.');
            if (err?.response?.status === 401 || err?.message?.includes('JWT')) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [assetId, navigate]);

    useEffect(() => {
        fetchAssetDetails();
    }, [fetchAssetDetails]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (import.meta.env.VITE_APP_ENV === 'local') {
                const { error: updErr } = await apiLocal.put(`/assets/${assetId}`, {
                    ...formData
                });
                if (updErr) throw updErr;

                setSnackbar({ open: true, message: 'Asset updated successfully!', severity: 'success' });
                setIsEditing(false);
                fetchAssetDetails();
            } else {
                const { error: updErr } = await supabase
                    .from('assets')
                    .update({ ...formData, updated_by: user?.name || 'User' })
                    .eq('id', assetId);

                if (updErr) throw updErr;

                setSnackbar({ open: true, message: 'Asset updated successfully!', severity: 'success' });
                setIsEditing(false);
                fetchAssetDetails(); // Refresh to catch updated_by etc if needed
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError(err.message || 'Failed to update asset. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box className="fade-in-up">
                <Box sx={{ mb: 3 }}>
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="60%" />
                </Box>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

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
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Asset Details
                        {(isSuperAdmin || isAdmin) && !isEditing && (
                            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{ ml: 2 }}>
                                Edit
                            </Button>
                        )}
                        {isEditing && (
                            <Button size="small" color="error" variant="text" startIcon={<CloseIcon />} onClick={() => { setIsEditing(false); fetchAssetDetails(); }} sx={{ ml: 2 }}>
                                Cancel Edit
                            </Button>
                        )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Detailed information about this IT asset
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

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
                            <Typography variant="h6" fontWeight={700}>
                                Asset Information
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2.5 }} />

                        <Box component="form" onSubmit={handleSave} noValidate>
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
                                            disabled={!isEditing}
                                            InputLabelProps={f.type === 'date' ? { shrink: true } : undefined}
                                            InputProps={{
                                                startAdornment: f.name === 'serial_number' && (
                                                    <InputAdornment position="start">
                                                        <BarcodeIcon fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                ))}
                                <Grid size={12}>
                                    <TextField
                                        fullWidth multiline rows={3}
                                        id="specs" label="Specifications (e.g., Core i5, 16GB RAM)"
                                        name="specs" value={formData.specs} onChange={handleInputChange}
                                        disabled={!isEditing}
                                    />
                                </Grid>
                            </Grid>

                            {isEditing && (
                                <Button
                                    type="submit" fullWidth variant="contained" size="large"
                                    disabled={saving}
                                    startIcon={<SaveIcon />}
                                    sx={{ mt: 3, py: 1.4, fontSize: '1rem' }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Barcode & Photo Preview Card */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: { xs: 2.5, sm: 3 }, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: 2,
                                background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <BarcodeIcon sx={{ color: '#fff', fontSize: 18 }} />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>Barcode</Typography>
                        </Box>
                        <Divider sx={{ mb: 2.5 }} />

                        <Box sx={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', py: 4,
                            bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0',
                        }}>
                            {formData.serial_number ? (
                                <Barcode value={formData.serial_number} width={1.8} height={80} fontSize={14} />
                            ) : (
                                <Typography color="text.secondary">No serial number available.</Typography>
                            )}
                        </Box>
                    </Paper>

                    {formData.photo_url && (
                        <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Photo</Typography>
                            <Divider sx={{ mb: 2.5 }} />
                            <Box
                                component="img"
                                src={formData.photo_url}
                                onError={(e) => { e.target.style.display = 'none'; }}
                                sx={{
                                    width: '100%',
                                    maxHeight: 250,
                                    objectFit: 'contain',
                                    borderRadius: 2,
                                    bgcolor: '#f8fafc',
                                    border: '1px solid #e2e8f0'
                                }}
                            />
                        </Paper>
                    )}
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default AssetDetailsPage;

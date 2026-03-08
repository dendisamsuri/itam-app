import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import apiLocal from '../apiLocal';
import {
    Paper, Typography, TextField, Button, Box, Grid, Alert,
    Divider, InputAdornment, Skeleton, Snackbar, IconButton,
    useTheme, useMediaQuery, Stack, Chip
} from '@mui/material';
import {
    SaveOutlined as SaveIcon,
    Inventory2Outlined as InventoryIcon,
    QrCode2 as BarcodeIcon,
    ArrowBack as ArrowBackIcon,
    EditOutlined as EditIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';
import { getUserPayload } from '../utils/auth.js';

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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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
        getUserPayload().then(u => setUser(u));
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
                    <Skeleton variant="text" width="40%" height={48} />
                    <Skeleton variant="text" width="60%" height={24} />
                </Box>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, lg: 7 }}>
                        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 6 }} />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 6 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <Box className="fade-in-up">
            {/* Page Header */}
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1.5, sm: 2.5 }, mb: 4, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                    <IconButton
                        onClick={() => navigate('/')}
                        sx={{
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            flexShrink: 0,
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 },
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ArrowBackIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                    <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
                        Asset Details
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                    {(isSuperAdmin || isAdmin) && !isEditing && (
                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => setIsEditing(true)}
                            sx={{ borderRadius: '12px', px: { xs: 2, sm: 3 } }}
                            size={isMobile ? 'small' : 'medium'}
                        >
                            Edit
                        </Button>
                    )}
                    {isEditing && (
                        <Button
                            color="error"
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={() => { setIsEditing(false); fetchAssetDetails(); }}
                            sx={{ borderRadius: '12px', px: { xs: 2, sm: 3 } }}
                            size={isMobile ? 'small' : 'medium'}
                        >
                            Cancel
                        </Button>
                    )}
                    <Chip
                        label={formData.serial_number}
                        size="medium"
                        variant="outlined"
                        sx={{
                            fontWeight: 700,
                            borderColor: 'primary.light',
                            bgcolor: 'primary.lighter',
                            display: { xs: 'none', md: 'inline-flex' }
                        }}
                    />
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>{error}</Alert>}

            <Grid container spacing={4}>
                {/* Form Card */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Paper className="glassmorphism" sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: '14px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)'
                            }}>
                                <InventoryIcon sx={{ color: '#fff', fontSize: 22 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">
                                Asset Information
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 4, opacity: 0.6 }} />

                        <Box component="form" onSubmit={handleSave} noValidate>
                            <Grid container spacing={3}>
                                {fields.map((f) => (
                                    <Grid size={{ xs: f.xs, sm: f.sm }} key={f.name}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                                            {f.label}
                                        </Typography>
                                        <TextField
                                            required={f.required}
                                            fullWidth
                                            id={f.name}
                                            name={f.name}
                                            type={f.type || 'text'}
                                            value={formData[f.name]}
                                            onChange={handleInputChange}
                                            disabled={!isEditing}
                                            placeholder={`Enter ${f.label.toLowerCase()}...`}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    height: 54,
                                                    borderRadius: '12px',
                                                    bgcolor: isEditing ? 'transparent' : 'rgba(0,0,0,0.02)'
                                                }
                                            }}
                                            InputProps={{
                                                startAdornment: f.name === 'serial_number' && (
                                                    <InputAdornment position="start">
                                                        <BarcodeIcon color="primary" sx={{ opacity: 0.7 }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                ))}
                                <Grid size={12}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                                        Specifications (e.g., Core i5, 16GB RAM)
                                    </Typography>
                                    <TextField
                                        fullWidth multiline rows={4}
                                        id="specs"
                                        name="specs" value={formData.specs} onChange={handleInputChange}
                                        disabled={!isEditing}
                                        placeholder="Add detailed specifications here..."
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                borderRadius: '16px',
                                                bgcolor: isEditing ? 'transparent' : 'rgba(0,0,0,0.02)'
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {isEditing && (
                                <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
                                    <Button
                                        type="submit" fullWidth variant="contained" size="large"
                                        disabled={saving}
                                        startIcon={<SaveIcon />}
                                        sx={{ py: 1.8, fontSize: '1rem', fontWeight: 700, borderRadius: '14px' }}
                                    >
                                        {saving ? 'Updating...' : 'Save Changes'}
                                    </Button>
                                </Stack>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Sidebar Cards */}
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Stack spacing={4}>
                        <Paper className="glassmorphism" sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                <Box sx={{
                                    width: 44, height: 44, borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.4)'
                                }}>
                                    <BarcodeIcon sx={{ color: '#fff', fontSize: 22 }} />
                                </Box>
                                <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">Barcode Tag</Typography>
                            </Box>

                            <Divider sx={{ mb: 4, opacity: 0.6 }} />

                            <Box sx={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', py: 5,
                                bgcolor: 'rgba(255,255,255,0.4)', borderRadius: '20px', border: '1px solid',
                                borderColor: 'divider',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                {formData.serial_number ? (
                                    <>
                                        <Box sx={{ p: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
                                            <Barcode value={formData.serial_number} width={1.8} height={80} fontSize={14} background="#fff" />
                                        </Box>
                                        <Typography variant="caption" sx={{ mt: 3, color: 'text.disabled', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            Unit Inventory Identity
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography color="text.secondary" fontWeight={500}>Input SN to generate barcode</Typography>
                                )}
                            </Box>
                        </Paper>

                        {formData.photo_url && (
                            <Paper className="glassmorphism" sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">Unit Preview</Typography>
                                </ Box>
                                <Divider sx={{ mb: 4, opacity: 0.6 }} />
                                <Box
                                    component="img"
                                    src={formData.photo_url}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                    sx={{
                                        width: '100%',
                                        maxHeight: 320,
                                        objectFit: 'contain',
                                        borderRadius: '20px',
                                        bgcolor: 'rgba(0,0,0,0.02)',
                                        p: 2,
                                        transition: 'transform 0.3s ease',
                                        '&:hover': { transform: 'scale(1.02)' }
                                    }}
                                />
                            </Paper>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default AssetDetailsPage;

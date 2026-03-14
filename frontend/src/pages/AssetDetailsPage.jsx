import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataService } from '../utils/dataService';
import {
    Paper, Typography, TextField, Button, Box, Grid, Alert,
    Divider, InputAdornment, Skeleton, Snackbar, IconButton,
    useTheme, useMediaQuery, Stack, Chip, Autocomplete
} from '@mui/material';
import {
    SaveOutlined as SaveIcon,
    Inventory2Outlined as InventoryIcon,
    QrCode2 as BarcodeIcon,
    EditOutlined as EditIcon,
    Close as CloseIcon,
    FileDownload as DownloadIcon,
    AccountTreeOutlined as HierarchyIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';
import { getUserPayload } from '../utils/auth.js';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';
import { usePermissions } from '../PermissionsContext';

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
        photo_url: '', purchase_date: '', warranty_expiry: '',
        part_of_id: '', part_of_name: '', part_of_brand: '', part_of_serial: '', part_of_owner: ''
    });
    const [originalAsset, setOriginalAsset] = useState(null);
    const [subAssets, setSubAssets] = useState([]);


    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isEditing, setIsEditing] = useState(false);

    const { canWrite, userRole } = usePermissions();
    const [user, setUser] = useState(null);
    const isSuperAdmin = userRole === 'superadmin';
    const hasWriteAccess = canWrite('asset_list') || isSuperAdmin;

    useEffect(() => {
        getUserPayload().then(u => setUser(u));
    }, []);

    const fetchAssetDetails = useCallback(async () => {
        try {
            setLoading(true);
            const asset = await dataService.getAssetById(assetId);

            // Format dates for input type="date"
            if (asset.purchase_date) asset.purchase_date = asset.purchase_date.split('T')[0];
            if (asset.warranty_expiry) asset.warranty_expiry = asset.warranty_expiry.split('T')[0];

            const parent = Array.isArray(asset.parent) ? asset.parent[0] : asset.parent;
            setFormData({
                serial_number: asset.serial_number || '',
                name: asset.name || '',
                brand: asset.brand || '',
                model: asset.model || '',
                specs: asset.specs || '',
                photo_url: asset.photo_url || '',
                purchase_date: asset.purchase_date || '',
                warranty_expiry: asset.warranty_expiry || '',
                part_of_id: asset.part_of_id || '',
                part_of_name: parent?.name || '',
                part_of_brand: parent?.brand || '',
                part_of_serial: parent?.serial_number || '',
                part_of_owner: parent?.assigned_to || ''
            });
            setOriginalAsset(asset);
        } catch (err) {
            setError(err.message || 'Failed to load asset details.');
            if (err?.response?.status === 401 || err?.message?.includes('JWT') || err?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [assetId, navigate]);

    useEffect(() => {
        fetchAssetDetails();
    }, [fetchAssetDetails]);

    const fetchSubAssets = useCallback(async () => {
        try {
            const data = await dataService.getAssetChildren(assetId);
            setSubAssets(data);
        } catch (err) {
            console.error('Failed to fetch sub-assets:', err);
        }
    }, [assetId]);



    useEffect(() => {
        fetchSubAssets();
    }, [fetchSubAssets]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await dataService.updateAsset(assetId, { 
                ...formData, 
                updated_by: user?.name || 'User' 
            });

            setSnackbar({ open: true, message: 'Asset updated successfully!', severity: 'success' });
            setIsEditing(false);
            fetchAssetDetails();
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

    const handleDownloadBarcode = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `barcode-${formData.serial_number}.png`;
            link.href = url;
            link.click();
        }
    };

    if (loading) {
        return (
            <PageContainer>
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
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Asset Details"
                subtitle={formData.serial_number}
                backPath="/"
                action={
                    hasWriteAccess ? (
                        isEditing ? (
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<CloseIcon />}
                                onClick={() => { setIsEditing(false); fetchAssetDetails(); }}
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => setIsEditing(true)}
                            >
                                Edit
                            </Button>
                        )
                    ) : null
                }
            />

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>{error}</Alert>}

            <Grid container spacing={4}>
                {/* Form Card */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    <Paper className="glassmorphism" sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: '14px',
                                bgcolor: 'primary.main',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)'
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
                                        Part of (Parent Asset)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={formData.part_of_name ? `${formData.part_of_name} - ${formData.part_of_brand} (${formData.part_of_serial})` : 'None'}
                                        disabled
                                        sx={{
                                            '& .MuiInputBase-root': {
                                                height: 54,
                                                borderRadius: '12px',
                                                bgcolor: 'rgba(0,0,0,0.02)'
                                            }
                                        }}
                                    />
                                </Grid>

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
                                            <Barcode value={formData.serial_number} width={1.8} height={80} fontSize={14} background="#fff" renderer="canvas" />
                                        </Box>
                                        <Typography variant="caption" sx={{ mt: 3, color: 'text.disabled', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            Unit Inventory Identity
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<DownloadIcon />}
                                            onClick={handleDownloadBarcode}
                                            sx={{ mt: 2, borderRadius: '10px' }}
                                        >
                                            Download Barcode
                                        </Button>
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

                        {subAssets.length > 0 && (
                            <Paper className="glassmorphism" sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Box sx={{
                                        width: 44, height: 44, borderRadius: '14px',
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)'
                                    }}>
                                        <HierarchyIcon sx={{ color: '#fff', fontSize: 22 }} />
                                    </Box>
                                    <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">Included Parts</Typography>
                                </Box>
                                <Divider sx={{ mb: 4, opacity: 0.6 }} />
                                <Stack spacing={2}>
                                    {subAssets.map((asset) => (
                                        <Box
                                            key={asset.id}
                                            onClick={() => navigate(`/assets/${asset.id}`)}
                                            sx={{
                                                p: 2,
                                                borderRadius: '12px',
                                                bgcolor: 'rgba(0,0,0,0.02)',
                                                cursor: 'pointer',
                                                border: '1px solid transparent',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.04)',
                                                    borderColor: 'primary.main',
                                                    transform: 'translateX(4px)'
                                                }
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={700}>{asset.name} - {asset.brand}</Typography>
                                            <Typography variant="caption" color="text.secondary">{asset.serial_number}</Typography>
                                        </Box>
                                    ))}
                                </Stack>
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
        </PageContainer >
    );
}

export default AssetDetailsPage;

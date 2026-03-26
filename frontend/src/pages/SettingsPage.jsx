import React, { useState, useEffect } from 'react';
import {
    Paper, Typography, Box, Button, Grid, MenuItem, TextField,
    CircularProgress, Alert, Snackbar, Divider, Stack, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
    useTheme, useMediaQuery
} from '@mui/material';
import {
    SaveOutlined as SaveIcon,
    SettingsOutlined as SettingsIcon,
    Security as SecurityIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { dataService } from '../utils/dataService';
import { usePermissions } from '../PermissionsContext';
import PageContainer from '../components/PageContainer';
import PageHeader from '../components/PageHeader';

const MENU_ITEMS = [
    { key: 'asset_list', label: 'Asset List' },
    { key: 'employee_list', label: 'Employee List' },
    { key: 'asset_history', label: 'Asset History' },
    { key: 'repair_history', label: 'Repair History' },
    { key: 'add_asset', label: 'Add Asset' },
    { key: 'user_list', label: 'User List' },
    { key: 'settings', label: 'Settings' },
    { key: 'add_user', label: 'Add User' },
];

const ROLES = ['user', 'admin', 'superadmin'];

function SettingsPage() {
    const [employees, setEmployees] = useState([]);
    const [settings, setSettings] = useState({
        it_user_id: '',
        ga_user_id: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Role permissions state
    const [permissions, setPermissions] = useState({});
    const [savingPerms, setSavingPerms] = useState(false);
    const { refreshPermissions } = usePermissions();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [empRes, setRes, permRes] = await Promise.all([
                dataService.getEmployees({ rowsPerPage: 1000 }),
                dataService.getSettings(),
                dataService.getRolePermissions()
            ]);

            const empData = empRes.data || [];
            const permData = permRes || [];
            
            const settingsMap = {};
            (setRes || []).forEach(s => { settingsMap[s.key] = s.value; });
            const setData = {
                it_user_id: settingsMap.it_user_id || '',
                ga_user_id: settingsMap.ga_user_id || ''
            };

            setEmployees(empData);
            setSettings(setData);

            // Build permissions state from API data
            const permMap = {};
            for (const role of ROLES) {
                permMap[role] = {};
                for (const menu of MENU_ITEMS) {
                    permMap[role][menu.key] = { can_view: false, can_write: false };
                }
            }
            // Fill in from API
            if (Array.isArray(permData)) {
                for (const p of permData) {
                    if (permMap[p.role_name] && permMap[p.role_name][p.menu_key]) {
                        permMap[p.role_name][p.menu_key] = {
                            can_view: p.can_view || false,
                            can_write: p.can_write || false
                        };
                    }
                }
            }
            setPermissions(permMap);
        } catch (err) {
            setError('Failed to fetch data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await dataService.updateSettings(settings);
            setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
        } catch (err) {
            setError('Failed to save settings: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePermissionChange = (role, menuKey, field, checked) => {
        setPermissions(prev => ({
            ...prev,
            [role]: {
                ...prev[role],
                [menuKey]: {
                    ...prev[role][menuKey],
                    [field]: checked,
                    // if enabling can_write, also enable can_view
                    ...(field === 'can_write' && checked ? { can_view: true } : {}),
                    // if disabling can_view, also disable can_write
                    ...(field === 'can_view' && !checked ? { can_write: false } : {})
                }
            }
        }));
    };

    const handleSavePermissions = async () => {
        setSavingPerms(true);
        try {
            const permsArray = [];
            for (const role of ROLES) {
                for (const menu of MENU_ITEMS) {
                    permsArray.push({
                        role_name: role,
                        menu_key: menu.key,
                        can_view: permissions[role]?.[menu.key]?.can_view || false,
                        can_write: permissions[role]?.[menu.key]?.can_write || false,
                    });
                }
            }

            await dataService.updateRolePermissions(permsArray);

            await refreshPermissions();
            setSnackbar({ open: true, message: 'Role permissions saved successfully!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || err.message || 'Failed to save permissions.', severity: 'error' });
        } finally {
            setSavingPerms(false);
        }
    };

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Application Settings"
                subtitle="Configure system-wide parameters"
            />

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>{error}</Alert>}

            <Stack spacing={4}>
                <Accordion defaultExpanded className="glassmorphism" sx={{ borderRadius: '24px !important', '&:before': { display: 'none' }, overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: '14px',
                                bgcolor: 'primary.main',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)'
                            }}>
                                <SettingsIcon sx={{ color: '#fff', fontSize: 22 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">
                                User Configuration
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: { xs: 3, sm: 4 }, pt: 0 }}>
                        <Divider sx={{ mb: 4, opacity: 0.6 }} />

                        <Grid container>
                            <Grid size={{ xs: 12, md: 8, lg: 6 }}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                                            Default IT Receiver (Employee)
                                        </Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            name="it_user_id"
                                            value={settings.it_user_id}
                                            onChange={(e) => setSettings({ ...settings, it_user_id: e.target.value })}
                                            SelectProps={{ MenuProps: { disableScrollLock: true, disablePortal: true } }}
                                            inputProps={{ autoComplete: 'off' }}
                                            sx={{ '& .MuiInputBase-root': { borderRadius: '12px', height: 54 } }}
                                        >
                                            <MenuItem value=""><em>Select Employee</em></MenuItem>
                                            {employees.map((emp) => (
                                                <MenuItem key={emp.id} value={emp.id}>{emp.name} ({emp.department})</MenuItem>
                                            ))}
                                        </TextField>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', ml: 0.5 }}>
                                            This employee will receive assets when "Return to IT" is selected.
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block', ml: 0.5 }}>
                                            Default GA Receiver (Employee)
                                        </Typography>
                                        <TextField
                                            select
                                            fullWidth
                                            name="ga_user_id"
                                            value={settings.ga_user_id}
                                            onChange={(e) => setSettings({ ...settings, ga_user_id: e.target.value })}
                                            SelectProps={{ MenuProps: { disableScrollLock: true, disablePortal: true } }}
                                            inputProps={{ autoComplete: 'off' }}
                                            sx={{ '& .MuiInputBase-root': { borderRadius: '12px', height: 54 } }}
                                        >
                                            <MenuItem value=""><em>Select Employee</em></MenuItem>
                                            {employees.map((emp) => (
                                                <MenuItem key={emp.id} value={emp.id}>{emp.name} ({emp.department})</MenuItem>
                                            ))}
                                        </TextField>
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', ml: 0.5 }}>
                                            This employee will receive assets when "Return to GA" is selected.
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSave}
                                        disabled={saving}
                                        sx={{ py: 1.8, fontSize: '1rem', fontWeight: 700, borderRadius: '14px', mt: 2, alignSelf: isMobile ? 'stretch' : 'flex-start', width: isMobile ? '100%' : 'auto' }}
                                    >
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* Role Management Section */}
                <Accordion className="glassmorphism" sx={{ borderRadius: '24px !important', '&:before': { display: 'none' }, overflow: 'hidden' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: '14px',
                                bgcolor: 'secondary.main',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)'
                            }}>
                                <SecurityIcon sx={{ color: '#fff', fontSize: 22 }} />
                            </Box>
                            <Box textAlign="left">
                                <Typography variant="h5" fontWeight={800} letterSpacing="-0.01em">
                                    Role Management
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Configure menu access and permissions for each role
                                </Typography>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: { xs: 3, sm: 4 }, pt: 0 }}>
                        <Divider sx={{ mb: 4, opacity: 0.6 }} />

                        {isMobile ? (
                            <Stack spacing={2}>
                                {MENU_ITEMS.map((menu) => (
                                    <Paper elevation={0} key={menu.key} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: 'text.primary' }}>
                                            {menu.label}
                                        </Typography>
                                        <Stack spacing={1}>
                                            {ROLES.map(role => (
                                                <Box key={role} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: 'background.default', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                                                    <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600, color: 'text.secondary' }}>
                                                        {role}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    size="small"
                                                                    checked={permissions[role]?.[menu.key]?.can_view || false}
                                                                    onChange={(e) => handlePermissionChange(role, menu.key, 'can_view', e.target.checked)}
                                                                />
                                                            }
                                                            label={<Typography variant="caption" fontWeight={600}>View</Typography>}
                                                            labelPlacement="start"
                                                            sx={{ m: 0 }}
                                                        />
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    size="small"
                                                                    checked={permissions[role]?.[menu.key]?.can_write || false}
                                                                    onChange={(e) => handlePermissionChange(role, menu.key, 'can_write', e.target.checked)}
                                                                />
                                                            }
                                                            label={<Typography variant="caption" fontWeight={600}>Write</Typography>}
                                                            labelPlacement="start"
                                                            sx={{ m: 0 }}
                                                        />
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <TableContainer sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Menu</TableCell>
                                            {ROLES.map(role => (
                                                <TableCell key={role} align="center" colSpan={2} sx={{
                                                    fontWeight: 700,
                                                    textTransform: 'capitalize',
                                                    borderLeft: '1px solid',
                                                    borderColor: 'divider'
                                                }}>
                                                    {role}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell />
                                            {ROLES.map(role => (
                                                <React.Fragment key={role}>
                                                    <TableCell align="center" sx={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        py: 0.5,
                                                        borderLeft: '1px solid',
                                                        borderColor: 'divider',
                                                        color: 'text.secondary'
                                                    }}>
                                                        View
                                                    </TableCell>
                                                    <TableCell align="center" sx={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        py: 0.5,
                                                        color: 'text.secondary'
                                                    }}>
                                                        Write
                                                    </TableCell>
                                                </React.Fragment>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {MENU_ITEMS.map((menu) => (
                                            <TableRow key={menu.key} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{menu.label}</TableCell>
                                                {ROLES.map(role => (
                                                    <React.Fragment key={role}>
                                                        <TableCell align="center" sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                                                            <Checkbox
                                                                size="small"
                                                                checked={permissions[role]?.[menu.key]?.can_view || false}
                                                                onChange={(e) => handlePermissionChange(role, menu.key, 'can_view', e.target.checked)}
                                                                sx={{ p: 0.5 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Checkbox
                                                                size="small"
                                                                checked={permissions[role]?.[menu.key]?.can_write || false}
                                                                onChange={(e) => handlePermissionChange(role, menu.key, 'can_write', e.target.checked)}
                                                                sx={{ p: 0.5 }}
                                                            />
                                                        </TableCell>
                                                    </React.Fragment>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', flexDirection: isMobile ? 'column' : 'row' }}>
                            <Button
                                variant="contained"
                                //color="secondary"
                                size="large"
                                startIcon={<SaveIcon />}
                                onClick={handleSavePermissions}
                                disabled={savingPerms}
                                sx={{ py: 1.8, px: 4, fontSize: '1rem', fontWeight: 700, borderRadius: '14px', width: isMobile ? '100%' : 'auto' }}
                            >
                                {savingPerms ? 'Saving...' : 'Save Permissions'}
                            </Button>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Stack>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                disableWindowBlurListener
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default SettingsPage;

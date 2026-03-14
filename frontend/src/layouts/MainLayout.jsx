import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Box, Divider, Button,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    IconButton, BottomNavigation, BottomNavigationAction, useMediaQuery,
    useTheme, Paper, Switch, Stack
} from '@mui/material';
import {
    ListAlt as ListAltIcon,
    Add as AddIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Inventory2Outlined as InventoryIcon,
    History as HistoryIcon,
    Build as BuildIcon,
    PersonAddOutlined as PersonAddIcon,
    People as PeopleIcon,
    SettingsOutlined as SettingsIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon
} from '@mui/icons-material';

import { getUserPayload, logout } from '../utils/auth.js';
import { useThemeMode } from '../ThemeContext';
import { usePermissions } from '../PermissionsContext';

const drawerWidth = 260;
const miniDrawerWidth = 80;

function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { darkMode, toggleDarkMode } = useThemeMode();
    const { canView } = usePermissions();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
    const [user, setUser] = useState(null);

    const isSuperAdmin = user?.role === 'superadmin';
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        getUserPayload().then(u => setUser(u));
    }, []);

    // All possible menu items with permission keys
    const allMenuItems = useMemo(() => [
        { text: 'Asset List', path: '/', icon: <ListAltIcon />, permKey: 'asset_list', defaultAccess: true },
        { text: 'Employee List', path: '/employees', icon: <PersonAddIcon />, permKey: 'employee_list', defaultAccess: true },
        { text: 'Asset History', path: '/history', icon: <HistoryIcon />, permKey: 'asset_history', defaultAccess: true },
        { text: 'Repair History', path: '/repairs', icon: <BuildIcon />, permKey: 'repair_history', defaultAccess: true },
        { text: 'Add Asset', path: '/add', icon: <AddIcon />, permKey: 'add_asset', defaultAccess: isSuperAdmin || isAdmin },
        { text: 'User List', path: '/users', icon: <PeopleIcon />, permKey: 'user_list', defaultAccess: isSuperAdmin || isAdmin },
        { text: 'Add User', path: '/add-user', icon: <PersonAddIcon />, permKey: 'add_user', defaultAccess: isSuperAdmin },
        { text: 'Settings', path: '/settings', icon: <SettingsIcon />, permKey: 'settings', defaultAccess: isSuperAdmin || isAdmin }

    ], [isSuperAdmin, isAdmin]);

    // Filter based on DB permissions, fallback to defaults if none configured
    const menuItems = useMemo(() => {
        return allMenuItems.filter(item => {
            const viewPerm = canView(item.permKey);
            if (viewPerm === null) return item.defaultAccess;
            return viewPerm;
        });
    }, [allMenuItems, canView]);

    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
    const handleLogoutClick = () => setOpenLogoutDialog(true);
    const handleLogoutConfirm = async () => {
        await logout();
        setOpenLogoutDialog(false);
        navigate('/login');
    };

    const currentBottomNav = menuItems.findIndex(item => item.path === location.pathname);
    const actualDrawerWidth = isTablet ? miniDrawerWidth : drawerWidth;

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: isTablet ? 'center' : 'flex-start', gap: 2, height: 72, borderBottom: '1px solid', borderColor: 'divider' }}>
                <InventoryIcon color="primary" sx={{ fontSize: 32 }} />
                {!isTablet && <Typography variant="h6" fontWeight={700} color="text.primary">IT Asset Management</Typography>}
            </Box>

            <Box sx={{ flex: 1, py: 2 }}>
                <List>
                    {menuItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block', px: 1, mb: 0.5 }}>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                                    sx={{
                                        minHeight: 48,
                                        borderRadius: 1,
                                        justifyContent: isTablet ? 'center' : 'initial',
                                        flexDirection: isTablet ? 'column' : 'row',
                                        bgcolor: isSelected ? 'primary.lighter' : 'transparent',
                                        '&.Mui-selected': { bgcolor: 'primary.lighter' },
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: isTablet ? 0 : 40, justifyContent: 'center', color: isSelected ? 'primary.main' : 'text.secondary' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    {isTablet ? (
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: isSelected ? 600 : 400, mt: 0.5, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                                            {item.text.split(' ')[0]}
                                        </Typography>
                                    ) : (
                                        <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'primary.main' : 'text.primary' }} />
                                    )}
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                {/* User Info */}
                {user && (
                    <Box sx={{ px: isTablet ? 0 : 2, mb: 2, display: 'flex', flexDirection: 'column', alignItems: isTablet ? 'center' : 'flex-start' }}>
                        {isTablet ? (
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', mb: 1 }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </Box>
                        ) : (
                            <>
                                <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap sx={{ maxWidth: '100%' }}>
                                    {user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', fontWeight: 500 }} noWrap>
                                    {user.role}
                                </Typography>
                            </>
                        )}
                    </Box>
                )}
                {/* Dark Mode Toggle */}
                {isTablet ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <IconButton onClick={toggleDarkMode} size="small" sx={{ color: 'text.secondary' }}>
                            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Box>
                ) : (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, mb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            {darkMode ? <DarkModeIcon sx={{ fontSize: 20, color: 'text.secondary' }} /> : <LightModeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />}
                            <Typography variant="body2" fontWeight={500} color="text.secondary">
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </Typography>
                        </Stack>
                        <Switch
                            size="small"
                            checked={darkMode}
                            onChange={toggleDarkMode}
                            color="primary"
                        />
                    </Stack>
                )}
                <ListItemButton onClick={handleLogoutClick} sx={{ borderRadius: 1, color: 'error.main', '&:hover': { bgcolor: 'error.lighter' } }}>
                    <ListItemIcon sx={{ minWidth: isTablet ? 0 : 40, color: 'inherit' }}><LogoutIcon /></ListItemIcon>
                    {!isTablet && <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />}
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {(isMobile || isTablet) && (
                <AppBar position="fixed" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderRadius: 0, color: '#fff' }}>
                    <Toolbar sx={{ height: 72 }}>
                        <IconButton edge="start" color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap fontWeight={700}>IT Asset Management</Typography>
                    </Toolbar>
                </AppBar>
            )}

            <Box component="nav" sx={{ width: { sm: actualDrawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
                    {drawerContent}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: actualDrawerWidth, borderRight: '1px solid', borderColor: 'divider' } }} open>
                    {drawerContent}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, pt: { xs: 11, sm: 11, md: 3 }, pb: { xs: 10, sm: 3 }, width: { sm: `calc(100% - ${actualDrawerWidth}px)` }, minHeight: '100vh' }}>
                <Outlet />
            </Box>

            {isMobile && (
                <Paper elevation={3} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.appBar }}>
                    <BottomNavigation value={currentBottomNav} onChange={(_, newVal) => navigate(menuItems[newVal].path)} showLabels sx={{ height: 64 }}>
                        {menuItems.slice(0, 4).map((item) => (
                            <BottomNavigationAction key={item.text} label={item.text.split(' ')[0]} icon={item.icon} />
                        ))}
                    </BottomNavigation>
                </Paper>
            )}

            <Dialog open={openLogoutDialog} onClose={() => setOpenLogoutDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle fontWeight={600}>Confirm Logout</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to log out of the system?</DialogContentText></DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenLogoutDialog(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleLogoutConfirm} color="error" variant="contained" disableElevation>Logout</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default MainLayout;
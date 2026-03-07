import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Box, Divider, Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  IconButton, BottomNavigation, BottomNavigationAction, useMediaQuery,
  useTheme, Avatar
} from '@mui/material';
import {
  ListAlt as ListAltIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Inventory2Outlined as InventoryIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Build as BuildIcon
} from '@mui/icons-material';

import { PersonAddOutlined as PersonAddIcon } from '@mui/icons-material';

import apiLocal from '../apiLocal';

const getTokenPayload = async () => {
  if (import.meta.env.VITE_APP_ENV === 'local') {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      // Decode JWT token directly (client side) or use an API check
      // As a simple workaround for local, since we just need the payload:
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      return decoded.user ? {
        id: decoded.user.id,
        role: decoded.user.role || 'user',
        name: decoded.user.name || 'User'
      } : null;
    } catch (e) {
      return null;
    }
  } else {
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
  }
};

const drawerWidth = 260;
const miniDrawerWidth = 80;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const [user, setUser] = useState(null);
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getTokenPayload().then(u => setUser(u));
  }, []);

  const menuItems = [
    { text: 'Asset List', path: '/', icon: <ListAltIcon /> },
    { text: 'Employee List', path: '/employees', icon: <PersonAddIcon /> },
    { text: 'Asset History', path: '/history', icon: <HistoryIcon /> },
    { text: 'Repair History', path: '/repairs', icon: <BuildIcon /> },
    ...((isSuperAdmin || isAdmin) ? [
      { text: 'Add Asset', path: '/add', icon: <AddIcon /> }
    ] : []),
    ...(isSuperAdmin ? [
      { text: 'Add User', path: '/add-user', icon: <PersonAddIcon /> }
    ] : [])
  ];

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogoutClick = () => setOpenLogoutDialog(true);
  const handleLogoutConfirm = async () => {
    if (import.meta.env.VITE_APP_ENV !== 'local') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('token');
    setOpenLogoutDialog(false);
    navigate('/login');
  };
  const handleLogoutCancel = () => setOpenLogoutDialog(false);

  const currentBottomNav = menuItems.findIndex(item => item.path === location.pathname);

  // Dynamic values based on screen size
  const actualDrawerWidth = isTablet ? miniDrawerWidth : drawerWidth;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowX: 'hidden' }}>
      {/* Brand Header */}
      <Box
        sx={{
          px: isTablet ? 0 : 3, py: 3,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1.5,
          minHeight: 80,
        }}
      >
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 42, height: 42 }}>
          <InventoryIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Avatar>
        {!isTablet && (
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center' }}>
            IT Asset Management
          </Typography>
        )}
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: isTablet ? 1 : 2, py: 3 }}>
        {!isTablet && (
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.7rem', pl: 1, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Main Menu
          </Typography>
        )}
        <List sx={{ mt: 1 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                  sx={{
                    px: isTablet ? 0 : 2,
                    py: 1.5,
                    justifyContent: isTablet ? 'center' : 'initial',
                    flexDirection: isTablet ? 'column' : 'row',
                    minHeight: 48,
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: isTablet ? 0 : 38,
                    mr: isTablet ? 0 : 1,
                    justifyContent: 'center',
                    color: isSelected ? 'primary.main' : 'text.secondary'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  {isTablet ? (
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: isSelected ? 800 : 600, mt: 0.5, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                      {item.text.split(' ')[0]}
                    </Typography>
                  ) : (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 700 : 500 }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Logout */}
      <Box sx={{ px: isTablet ? 1 : 2, py: 2 }}>
        <Divider sx={{ mb: 2, opacity: 0.5 }} />
        <ListItemButton
          onClick={handleLogoutClick}
          sx={{
            borderRadius: 3,
            px: isTablet ? 0 : 2,
            py: 1.5,
            justifyContent: isTablet ? 'center' : 'initial',
            flexDirection: isTablet ? 'column' : 'row',
            color: 'error.main',
            '&:hover': { bgcolor: '#fef2f2' },
          }}
        >
          <ListItemIcon sx={{
            minWidth: isTablet ? 0 : 38,
            mr: isTablet ? 0 : 1,
            color: 'error.main',
            justifyContent: 'center'
          }}>
            <LogoutIcon />
          </ListItemIcon>
          {isTablet ? (
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, mt: 0.5, color: 'error.main' }}>
              Exit
            </Typography>
          ) : (
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 700, color: 'error.main' }}
            />
          )}
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar — mobile/tablet only */}
      {(isMobile || isTablet) && (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar sx={{ height: 70 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32, mr: 1.5 }}>
              <InventoryIcon sx={{ fontSize: 18, color: '#fff' }} />
            </Avatar>
            <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              IT Asset Management
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { sm: actualDrawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: 'background.paper', border: 'none' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop/Tablet permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: actualDrawerWidth,
              bgcolor: 'background.paper',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 11, sm: 12, md: 4 }, // Add padding top for mobile/tablet AppBar
          pb: { xs: 12, sm: 3 },
          width: { sm: `calc(100% - ${actualDrawerWidth}px)` },
          minHeight: '100vh',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Outlet />
      </Box>

      {/* Bottom nav — mobile only */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (t) => t.zIndex.appBar,
            bgcolor: 'background.paper',
          }}
        >
          <BottomNavigation
            value={currentBottomNav}
            onChange={(_, newVal) => navigate(menuItems[newVal].path)}
            showLabels
            sx={{ height: 64 }}
          >
            {menuItems.map((item) => (
              <BottomNavigationAction
                key={item.text}
                label={item.text}
                icon={item.icon}
                sx={{ '&.Mui-selected': { color: 'primary.main' } }}
              />
            ))}
          </BottomNavigation>
        </Box>
      )}

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleLogoutCancel}
        PaperProps={{ sx: { mx: 2, width: '100%', maxWidth: 380 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to log out of the system?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleLogoutCancel} variant="outlined">Cancel</Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MainLayout;

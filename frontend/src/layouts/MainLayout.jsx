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

const drawerWidth = 260;

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const [user, setUser] = useState(null);
  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    getTokenPayload().then(u => setUser(u));
  }, []);

  const menuItems = [
    { text: 'Asset List', path: '/', icon: <ListAltIcon /> },
    { text: 'Employee List', path: '/employees', icon: <PersonAddIcon /> },
    { text: 'Asset History', path: '/history', icon: <HistoryIcon /> },
    { text: 'Repair History', path: '/repairs', icon: <BuildIcon /> },
    ...(isSuperAdmin ? [
      { text: 'Add Asset', path: '/add', icon: <AddIcon /> },
      { text: 'Add User', path: '/add-user', icon: <PersonAddIcon /> }
    ] : [])
  ];

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogoutClick = () => setOpenLogoutDialog(true);
  const handleLogoutConfirm = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token'); // Keep for App.jsx sync if needed
    setOpenLogoutDialog(false);
    navigate('/login');
  };
  const handleLogoutCancel = () => setOpenLogoutDialog(false);

  const currentBottomNav = menuItems.findIndex(item => item.path === location.pathname);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box
        sx={{
          px: 3, py: 2.5,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}
      >
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 38, height: 38 }}>
          <InventoryIcon sx={{ fontSize: 20, color: '#fff' }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#fff', lineHeight: 1.2, fontWeight: 700, fontSize: '0.95rem' }}>
            ITAM System
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>
            IT Asset Management
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto', color: '#fff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 2, py: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', pl: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </Typography>
        <List sx={{ mt: 1 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => { navigate(item.path); if (isMobile) setMobileOpen(false); }}
                  sx={{ px: 2, py: 1.2 }}
                >
                  <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom Logout */}
      <Box sx={{ px: 2, py: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <ListItemButton
          onClick={handleLogoutClick}
          sx={{
            borderRadius: 2,
            px: 2,
            py: 1.2,
            color: 'error.main',
            '&:hover': { bgcolor: '#fef2f2' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600, color: 'error.main' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar — mobile only */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <InventoryIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="h6" noWrap sx={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              ITAM System
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: 'background.paper' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              bgcolor: 'background.paper',
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
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
          p: { xs: 2, md: 3 },
          pt: { xs: 9, md: 3 },
          pb: { xs: 10, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
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

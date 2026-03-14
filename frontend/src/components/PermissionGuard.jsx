import React from 'react';
import { usePermissions } from '../PermissionsContext';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PermissionGuard = ({ permKey, defaultAccessLevel = 'all', children }) => {
    const { canView, loaded, userRole } = usePermissions();
    const navigate = useNavigate();

    // While permissions are still loading, you could show a loader or nothing
    if (!loaded) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    let defaultAccess = true;
    if (defaultAccessLevel === 'admin') defaultAccess = userRole === 'superadmin' || userRole === 'admin';
    if (defaultAccessLevel === 'superadmin') defaultAccess = userRole === 'superadmin';

    const viewPerm = canView(permKey);
    const hasAccess = viewPerm !== null ? viewPerm : defaultAccess;

    if (!hasAccess) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
                <Typography variant="h3" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                    403
                </Typography>
                <Typography variant="h5" color="text.primary" gutterBottom>
                    Access Denied
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph maxWidth="400px">
                    You do not have the necessary permissions to view this page. If you believe this is an error, please contact your administrator.
                </Typography>
                <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                    Go Back
                </Button>
            </Box>
        );
    }

    return children;
};

export default PermissionGuard;

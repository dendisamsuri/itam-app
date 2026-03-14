import React from 'react';
import { Box } from '@mui/material';

/**
 * PageContainer provides a consistent wrapper for all pages.
 * It handles standard padding and entrance animations.
 */
const PageContainer = ({ children, sx = {}, ...props }) => {
    return (
        <Box
            className="fade-in-up"
            sx={{
                width: '100%',
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 3, md: 4 },
                ...sx
            }}
            {...props}
        >
            {children}
        </Box>
    );
};

export default PageContainer;

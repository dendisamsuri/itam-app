import React from 'react';
import { Box, Typography, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * PageHeader provides a standardized header for all pages.
 * Includes title, optional back button, and action area.
 */
const PageHeader = ({
    title,
    subtitle,
    backPath,
    action,
    sx = {}
}) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                ...sx
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                {backPath && (
                    <IconButton
                        onClick={() => navigate(backPath)}
                        sx={{
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            width: { xs: 36, sm: 44 },
                            height: { xs: 36, sm: 44 },
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            '&:hover': { bgcolor: 'action.hover' }
                        }}
                        size="small"
                    >
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                )}
                <Box>
                    <Typography
                        variant={isMobile ? 'h5' : 'h4'}
                        sx={{
                            fontWeight: 800,
                            color: 'text.primary',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                mt: 0.5,
                                fontWeight: 500
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
            </Box>

            {action && (
                <Box
                    sx={{
                        width: { xs: '100%', sm: 'auto' },
                        display: 'flex',
                        justifyContent: { xs: 'stretch', sm: 'flex-end' }
                    }}
                >
                    {React.cloneElement(action, {
                        fullWidth: isMobile,
                        size: isMobile ? 'medium' : 'medium'
                    })}
                </Box>
            )}
        </Box>
    );
};

export default PageHeader;

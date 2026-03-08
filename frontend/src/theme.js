import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1',       // Indigo-500
      light: '#a5b4fc',
      lighter: '#ede9fe',
      dark: '#4338ca',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',       // Emerald-500
      light: '#6ee7b7',
      lighter: '#d1fae5',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    success: {
      main: '#22c55e',
      light: '#86efac',
      lighter: '#dcfce7',
    },
    warning: {
      main: '#f59e0b',
      light: '#fcd34d',
      lighter: '#fef3c7',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
      lighter: '#fee2e2',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',    // Slate-900
      secondary: '#64748b',  // Slate-500
    },
    divider: '#f1f5f9',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { 
      fontWeight: 800, 
      letterSpacing: '-0.02em',
      fontSize: 'clamp(1.75rem, 4vw, 2.125rem)',
    },
    h5: { 
      fontWeight: 800, 
      letterSpacing: '-0.02em',
      fontSize: 'clamp(1.5rem, 3.5vw, 1.75rem)',
    },
    h6: { 
      fontWeight: 700, 
      letterSpacing: '-0.01em',
      fontSize: 'clamp(1.125rem, 3vw, 1.25rem)',
    },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.6, fontSize: '1rem' },
    body2: { lineHeight: 1.6, fontSize: '0.875rem' },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          minHeight: 44, // Better touch target
          '@media (max-width:600px)': {
            minHeight: 48, // Even larger on mobile
            fontSize: '0.9375rem',
          },
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79,70,229,0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #0d9488 0%, #0891b2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0f766e 0%, #0e7490 100%)',
          },
        },
        sizeSmall: {
          padding: '7px 16px',
          fontSize: '0.8125rem',
          minHeight: 36,
          '@media (max-width:600px)': {
            minHeight: 40,
          },
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
          '@media (max-width:600px)': {
            padding: '16px 28px',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#f8fafc',
            transition: 'all 0.2s ease',
            minHeight: 44,
            '@media (max-width:600px)': {
              minHeight: 48, // Better touch target on mobile
              fontSize: '16px', // Prevents zoom on iOS
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4f46e5',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4f46e5',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            '@media (max-width:600px)': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
        elevation3: {
          boxShadow: '0 10px 40px rgba(79,70,229,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #f1f5f9',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
              borderColor: '#e2e8f0',
            }
          },
          '@media (max-width:600px)': {
            borderRadius: 16,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 10,
          fontSize: '0.75rem',
          height: 28,
        },
        colorSuccess: {
          backgroundColor: '#dcfce7',
          color: '#15803d',
        },
        colorWarning: {
          backgroundColor: '#fef3c7',
          color: '#b45309',
        },
        colorDefault: {
          backgroundColor: '#f1f5f9',
          color: '#475569',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 4px 20px rgba(79,70,229,0.15)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e2e8f0',
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          marginBottom: 6,
          padding: '10px 16px',
          minHeight: 48, // Better touch target
          transition: 'all 0.2s ease',
          '@media (max-width:600px)': {
            minHeight: 52,
            padding: '12px 16px',
          },
          '&.Mui-selected': {
            backgroundColor: '#ede9fe',
            color: '#4f46e5',
            '& .MuiListItemIcon-root': {
              color: '#4f46e5',
            },
            '&:hover': {
              backgroundColor: '#ddd6fe',
            },
          },
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: '#475569',
            backgroundColor: '#f8fafc',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '16px 24px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          borderColor: '#f1f5f9',
          '@media (max-width:900px)': {
            padding: '12px 16px',
            fontSize: '0.875rem',
          },
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          '@media (max-width:600px)': {
            borderRadius: 20,
            margin: 16,
            maxHeight: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            fontSize: '1.125rem',
            padding: '20px 20px 12px',
          },
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '16px 20px',
          },
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '12px 20px 20px',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
          height: 72, // Larger for tablets
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#4f46e5',
          },
          paddingTop: 12,
          paddingBottom: 12,
          minWidth: 64,
          fontSize: '0.75rem',
        },
        label: {
          fontSize: '0.75rem',
          '&.Mui-selected': {
            fontSize: '0.75rem',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          '@media (max-width:600px)': {
            minWidth: 48,
            minHeight: 48,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          minHeight: 44,
          '@media (max-width:600px)': {
            minHeight: 48,
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            fontSize: '16px', // Prevents zoom on iOS
          },
        },
      },
    },
  },
});

export default theme;

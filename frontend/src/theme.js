import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5',       // Indigo-600
      light: '#818cf8',
      dark: '#3730a3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0d9488',       // Teal-600
      light: '#2dd4bf',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#4ade80',
    },
    warning: {
      main: '#d97706',
      light: '#fbbf24',
    },
    error: {
      main: '#dc2626',
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
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
          padding: '10px 24px', // Increased for better touch
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
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
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
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
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4f46e5',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4f46e5',
              borderWidth: 2,
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
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
          }
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
          padding: '10px 16px', // Better touch target
          transition: 'all 0.2s ease',
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
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
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
        },
      },
    },
  },
});

export default theme;

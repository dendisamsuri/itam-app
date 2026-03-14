import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
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
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#a69279',
            light: '#c8bcac',
            lighter: '#f5f2ef',
            dark: '#847461',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#10b981',
            light: '#6ee7b7',
            lighter: '#d1fae5',
            dark: '#047857',
            contrastText: '#ffffff',
          },
          success: { main: '#22c55e', light: '#86efac', lighter: '#dcfce7' },
          warning: { main: '#f59e0b', light: '#fcd34d', lighter: '#fef3c7' },
          error: { main: '#ef4444', light: '#fca5a5', lighter: '#fee2e2' },
          background: { default: '#f8fafc', paper: '#ffffff' },
          text: { primary: '#0f172a', secondary: '#64748b' },
          divider: '#f1f5f9',
        }
      : {
          primary: {
            main: '#c8bcac',
            light: '#ddd5cb',
            lighter: '#2a2520',
            dark: '#a69279',
            contrastText: '#0f172a',
          },
          secondary: {
            main: '#34d399',
            light: '#6ee7b7',
            lighter: '#064e3b',
            dark: '#10b981',
            contrastText: '#0f172a',
          },
          success: { main: '#22c55e', light: '#4ade80', lighter: '#064e3b' },
          warning: { main: '#fbbf24', light: '#fcd34d', lighter: '#78350f' },
          error: { main: '#f87171', light: '#fca5a5', lighter: '#7f1d1d' },
          background: { default: '#0f172a', paper: '#1e293b' },
          text: { primary: '#f1f5f9', secondary: '#94a3b8' },
          divider: '#334155',
        }),
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
          minHeight: 44,
          '@media (max-width:600px)': {
            minHeight: 48,
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
          background: mode === 'light' ? '#a69279' : '#c8bcac',
          color: mode === 'light' ? '#ffffff' : '#0f172a',
          '&:hover': {
            background: mode === 'light' ? '#847461' : '#ddd5cb',
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
            backgroundColor: mode === 'light' ? '#f8fafc' : '#1e293b',
            transition: 'all 0.2s ease',
            minHeight: 44,
            '@media (max-width:600px)': {
              minHeight: 48,
              fontSize: '16px',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#a69279' : '#c8bcac',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#a69279' : '#c8bcac',
              borderWidth: 2,
            },
          },
          '& .MuiInputLabel-root': {
            '@media (max-width:600px)': {
              fontSize: '16px',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
            : '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
            : '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        },
        elevation3: {
          boxShadow: mode === 'light'
            ? '0 10px 40px rgba(166,146,121,0.08)'
            : '0 10px 40px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)'
            : '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
          border: `1px solid ${mode === 'light' ? '#f1f5f9' : '#334155'}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light'
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              borderColor: mode === 'light' ? '#e2e8f0' : '#475569',
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
          backgroundColor: mode === 'light' ? '#dcfce7' : '#064e3b',
          color: mode === 'light' ? '#15803d' : '#4ade80',
        },
        colorWarning: {
          backgroundColor: mode === 'light' ? '#fef3c7' : '#78350f',
          color: mode === 'light' ? '#b45309' : '#fbbf24',
        },
        colorDefault: {
          backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
          color: mode === 'light' ? '#475569' : '#94a3b8',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#a69279' : '#1e293b',
          backgroundImage: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
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
          minHeight: 48,
          transition: 'all 0.2s ease',
          '@media (max-width:600px)': {
            minHeight: 52,
            padding: '12px 16px',
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'light' ? '#f5f2ef' : '#2a2520',
            color: mode === 'light' ? '#847461' : '#c8bcac',
            '& .MuiListItemIcon-root': {
              color: mode === 'light' ? '#847461' : '#c8bcac',
            },
            '&:hover': {
              backgroundColor: mode === 'light' ? '#ede9e5' : '#3a3530',
            },
          },
          '&:hover': {
            backgroundColor: mode === 'light' ? '#f1f5f9' : '#334155',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            color: mode === 'light' ? '#475569' : '#94a3b8',
            backgroundColor: mode === 'light' ? '#f8fafc' : '#0f172a',
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
            backgroundColor: mode === 'light' ? '#f8fafc' : '#1e293b',
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
          borderColor: mode === 'light' ? '#f1f5f9' : '#334155',
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
          borderTop: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
          height: 72,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: mode === 'light' ? '#847461' : '#c8bcac',
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
            fontSize: '16px',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            fontSize: '16px',
          },
        },
      },
    },
  },
});

export default getTheme;

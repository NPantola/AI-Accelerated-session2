import { createTheme } from '@mui/material/styles';

// Color palette from UI guidelines
const colors = {
  primary: {
    main: '#1976d2',     // Blue 700
    light: '#42a5f5',    // Blue 400
    dark: '#1565c0',     // Blue 800
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#dc004e',     // Pink A400
    light: '#ff5983',    // Pink A200
    dark: '#9a0036',     // Pink A700
    contrastText: '#ffffff'
  },
  success: {
    main: '#4caf50'      // Green 500
  },
  warning: {
    main: '#ff9800'      // Orange 500
  },
  error: {
    main: '#f44336'      // Red 500
  },
  info: {
    main: '#2196f3'      // Blue 500
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    300: '#e0e0e0',
    500: '#9e9e9e',
    600: '#757575',
    900: '#212121'
  }
};

// Task status colors
export const taskStatusColors = {
  complete: colors.success.main,
  overdue: colors.error.main,
  dueSoon: colors.warning.main,
  noDueDate: colors.grey[500]
};

// Priority colors
export const priorityColors = {
  high: colors.error.main,
  medium: colors.warning.main,
  low: colors.success.main
};

const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    background: {
      default: colors.grey[50],
      paper: '#ffffff'
    },
    grey: colors.grey,
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[600]
    },
    divider: colors.grey[300]
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
    h1: {
      fontSize: '2rem',         // 32px
      fontWeight: 500,
      letterSpacing: '-0.5px'
    },
    h2: {
      fontSize: '1.5rem',       // 24px
      fontWeight: 500,
      letterSpacing: '0px'
    },
    h3: {
      fontSize: '1.25rem',      // 20px
      fontWeight: 500,
      letterSpacing: '0.15px'
    },
    body1: {
      fontSize: '1rem',         // 16px
      fontWeight: 400,
      letterSpacing: '0.5px',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',     // 14px
      fontWeight: 400,
      letterSpacing: '0.25px',
      lineHeight: 1.43
    },
    caption: {
      fontSize: '0.75rem',      // 12px
      fontWeight: 400,
      letterSpacing: '0.4px'
    },
    button: {
      fontSize: '0.875rem',     // 14px
      fontWeight: 500,
      letterSpacing: '1.25px',
      textTransform: 'uppercase'
    }
  },
  shape: {
    borderRadius: 8
  },
  spacing: 8,  // 8px base unit
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 36,
          textTransform: 'uppercase',
          fontWeight: 500,
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }
        },
        outlined: {
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)'
          }
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 12,
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          '&:hover': {
            boxShadow: '0 2px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.30)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.light
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.main,
              borderWidth: 2
            }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          '&.MuiChip-colorSuccess': {
            backgroundColor: colors.success.main,
            color: '#ffffff'
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: colors.warning.main,
            color: '#ffffff'
          },
          '&.MuiChip-colorError': {
            backgroundColor: colors.error.main,
            color: '#ffffff'
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
          '&:hover': {
            boxShadow: '0 5px 10px rgba(0,0,0,0.3)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          backgroundColor: colors.primary.main
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
        },
        elevation3: {
          boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
        }
      }
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  }
});

export default theme;
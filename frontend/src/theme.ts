/**
 * Material-UI Theme Configuration
 * CORTEXIA Design System - Following Fitur Pelafalan Design
 */

import { createTheme } from '@mui/material/styles';

// CORTEXIA Brand Colors
const cortexiaColors = {
  // Primary Orange Palette
  orange: {
    main: '#F89847',     // Main brand orange
    light: '#FFA560',    // Lighter orange
    dark: '#E57A2D',     // Darker orange
    lighter: '#FFBC7F',  // Very light orange
    pale: '#FFE5D1',     // Pale orange background
  },
  // Navy Blue Palette
  navy: {
    main: '#1E2B5F',     // Dark navy for text
    light: '#2D3E7F',    // Lighter navy
    dark: '#0F1A3F',     // Darker navy
  },
  // Purple/Indigo Palette
  purple: {
    main: '#6366F1',     // Indigo blue
    light: '#818CF8',    // Light purple
    dark: '#4F46E5',     // Dark indigo
    pale: '#E0E7FF',     // Pale purple background
  },
  // Status Colors
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Amber
  error: '#EF4444',      // Red
  info: '#3B82F6',       // Blue
  // Neutral Colors
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

const theme = createTheme({
  palette: {
    primary: {
      main: cortexiaColors.orange.main,
      light: cortexiaColors.orange.light,
      dark: cortexiaColors.orange.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: cortexiaColors.purple.main,
      light: cortexiaColors.purple.light,
      dark: cortexiaColors.purple.dark,
      contrastText: '#FFFFFF',
    },
    success: {
      main: cortexiaColors.success,
      light: '#34D399',
      dark: '#059669',
    },
    warning: {
      main: cortexiaColors.warning,
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: cortexiaColors.error,
      light: '#F87171',
      dark: '#DC2626',
    },
    info: {
      main: cortexiaColors.info,
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#F9F9FE',           // Very light purple-tinted background
      paper: '#FFFFFF',
    },
    text: {
      primary: cortexiaColors.navy.main,
      secondary: cortexiaColors.neutral[600],
    },
  },
  typography: {
    fontFamily: [
      'Outfit',
      'Inter',
      'Poppins',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.75rem',
      fontWeight: 800,
      color: cortexiaColors.navy.main,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: cortexiaColors.navy.main,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.875rem',
      fontWeight: 700,
      color: cortexiaColors.navy.main,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: cortexiaColors.navy.main,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: cortexiaColors.navy.main,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: cortexiaColors.navy.main,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '1rem',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 20,  // More rounded corners as per design
  },
  shadows: [
    'none',
    '0px 2px 8px rgba(0, 0, 0, 0.05)',
    '0px 4px 12px rgba(0, 0, 0, 0.08)',
    '0px 8px 24px rgba(0, 0, 0, 0.10)',
    '0px 12px 32px rgba(0, 0, 0, 0.12)',
    '0px 16px 48px rgba(0, 0, 0, 0.14)',
    '0px 20px 56px rgba(0, 0, 0, 0.16)',
    '0px 24px 64px rgba(0, 0, 0, 0.18)',
    '0px 28px 72px rgba(0, 0, 0, 0.20)',
    '0px 4px 16px rgba(248, 152, 71, 0.15)',  // Orange shadow
    '0px 4px 16px rgba(99, 102, 241, 0.15)',  // Purple shadow
    '0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 2px 8px rgba(0, 0, 0, 0.08)',
    '0px 4px 16px rgba(0, 0, 0, 0.10)',
    '0px 8px 24px rgba(0, 0, 0, 0.12)',
    '0px 12px 32px rgba(0, 0, 0, 0.14)',
    '0px 16px 40px rgba(0, 0, 0, 0.16)',
    '0px 20px 48px rgba(0, 0, 0, 0.18)',
    '0px 24px 56px rgba(0, 0, 0, 0.20)',
    '0px 28px 64px rgba(0, 0, 0, 0.22)',
    '0px 32px 72px rgba(0, 0, 0, 0.24)',
    '0px 36px 80px rgba(0, 0, 0, 0.26)',
    '0px 40px 88px rgba(0, 0, 0, 0.28)',
    '0px 44px 96px rgba(0, 0, 0, 0.30)',
    '0px 48px 104px rgba(0, 0, 0, 0.32)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          borderRadius: '28px',  // Pill-shaped buttons
          padding: '12px 32px',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
        },
        contained: {
          boxShadow: '0px 4px 12px rgba(248, 152, 71, 0.25)',
          '&:hover': {
            boxShadow: '0px 6px 20px rgba(248, 152, 71, 0.35)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${cortexiaColors.orange.main} 0%, ${cortexiaColors.orange.light} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${cortexiaColors.orange.dark} 0%, ${cortexiaColors.orange.main} 100%)`,
          },
        },
        outlined: {
          borderWidth: '2px',
          borderRadius: '28px',
          padding: '10px 32px',
          '&:hover': {
            borderWidth: '2px',
            backgroundColor: 'rgba(248, 152, 71, 0.05)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(248, 152, 71, 0.08)',
          },
        },
        sizeLarge: {
          padding: '16px 40px',
          fontSize: '1.125rem',
          borderRadius: '32px',
        },
        sizeSmall: {
          padding: '8px 24px',
          fontSize: '0.875rem',
          borderRadius: '24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.10)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: cortexiaColors.orange.pale,
          color: cortexiaColors.orange.dark,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '16px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: cortexiaColors.orange.light,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: cortexiaColors.orange.main,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          height: '8px',
          backgroundColor: cortexiaColors.neutral[200],
        },
        bar: {
          borderRadius: '8px',
          background: `linear-gradient(90deg, ${cortexiaColors.orange.main} 0%, ${cortexiaColors.orange.light} 100%)`,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: `3px solid ${cortexiaColors.orange.pale}`,
        },
      },
    },
  },
});

// Custom theme extensions for CORTEXIA components
declare module '@mui/material/styles' {
  interface Theme {
    cortexia: {
      colors: typeof cortexiaColors;
      decorativeShapes: {
        circle: string;
        triangle: string;
        sparkle: string;
      };
    };
  }
  interface ThemeOptions {
    cortexia?: {
      colors?: typeof cortexiaColors;
      decorativeShapes?: {
        circle?: string;
        triangle?: string;
        sparkle?: string;
      };
    };
  }
}

// Add custom CORTEXIA properties
const cortexiaTheme = createTheme(theme, {
  cortexia: {
    colors: cortexiaColors,
    decorativeShapes: {
      circle: '50%',
      triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      sparkle: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    },
  },
});

export default cortexiaTheme;

import { MD3LightTheme, configureFonts } from 'react-native-paper';

// Custom color palette based on the UI design
const colors = {
  primary: '#6366F1', // Indigo primary
  primaryContainer: '#E0E7FF',
  secondary: '#10B981', // Green for success states
  secondaryContainer: '#D1FAE5',
  tertiary: '#F59E0B', // Orange for warning states
  tertiaryContainer: '#FEF3C7',
  surface: '#1E293B', // Dark surface from design
  surfaceVariant: '#334155',
  background: '#0F172A', // Dark background
  error: '#EF4444',
  errorContainer: '#FEE2E2',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1E1B4B',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#064E3B',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#92400E',
  onSurface: '#F8FAFC',
  onSurfaceVariant: '#CBD5E1',
  onBackground: '#F8FAFC',
  onError: '#FFFFFF',
  onErrorContainer: '#7F1D1D',
  outline: '#475569',
  outlineVariant: '#64748B',
  inverseSurface: '#F8FAFC',
  inverseOnSurface: '#0F172A',
  inversePrimary: '#4338CA',
  shadow: '#000000',
  scrim: '#000000',
  backdrop: 'rgba(15, 23, 42, 0.4)',
  // Custom colors for delivery status
  delivered: '#10B981',
  inProgress: '#F59E0B',
  pending: '#6B7280',
  cancelled: '#EF4444'
};

// Font configuration
const fontConfig = {
  web: {
    regular: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100' as const,
    },
  },
  android: {
    regular: {
      fontFamily: 'Roboto',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'Roboto',
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: 'Roboto',
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: 'Roboto',
      fontWeight: '100' as const,
    },
  },
};

export const theme = {
  ...MD3LightTheme,
  colors,
  fonts: configureFonts({ config: fontConfig }),
  roundness: 12,
  // Custom spacing system
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  // Custom elevation
  elevation: {
    level0: 0,
    level1: 2,
    level2: 4,
    level3: 8,
    level4: 12,
    level5: 16
  }
};

export type AppTheme = typeof theme;
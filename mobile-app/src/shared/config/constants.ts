// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.68.60:5006/api' // Development URL
  : 'https://siya-portal.web.app/api'; // Production URL - Firebase Hosting

// App Configuration
export const APP_NAME = 'Siya Mobile';
export const APP_VERSION = '1.0.0';

// Navigation Routes
export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Driver
  DRIVER_HOME: 'DriverHome',
  DRIVER_DELIVERIES: 'DriverDeliveries',
  DRIVER_DELIVERY_DETAILS: 'DriverDeliveryDetails',
  DRIVER_PROFILE: 'DriverProfile',
  DRIVER_VEHICLE_CHECKLIST: 'DriverVehicleChecklist',
  
  // Client
  CLIENT_HOME: 'ClientHome',
  CLIENT_DELIVERIES: 'ClientDeliveries',
  CLIENT_DELIVERY_DETAILS: 'ClientDeliveryDetails',
  CLIENT_PROFILE: 'ClientProfile',
  
  // Dispatcher
  DISPATCHER_HOME: 'DispatcherHome',
  DISPATCHER_DELIVERIES: 'DispatcherDeliveries',
  DISPATCHER_DELIVERY_DETAILS: 'DispatcherDeliveryDetails',
  DISPATCHER_DRIVERS: 'DispatcherDrivers',
  DISPATCHER_PROFILE: 'DispatcherProfile',
};

// Delivery Status
export const DELIVERY_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Stop Status
export const STOP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  CLIENT: 'client',
  FLEET_MANAGER: 'fleet_manager',
} as const;

// Colors - Glassmorphism Theme
export const COLORS = {
  // Primary Colors
  primary: {
    main: '#3b82f6',
    dark: '#2563eb',
    light: '#60a5fa',
  },
  
  // Secondary Colors
  secondary: {
    main: '#6b7280',
    dark: '#4b5563',
    light: '#9ca3af',
  },
  
  // Status Colors
  success: {
    main: '#22c55e',
    dark: '#16a34a',
    light: 'rgba(34, 197, 94, 0.1)',
  },
  
  danger: {
    main: '#ef4444',
    dark: '#dc2626',
    light: 'rgba(239, 68, 68, 0.1)',
  },
  
  warning: {
    main: '#f59e0b',
    dark: '#d97706',
    light: 'rgba(245, 158, 11, 0.1)',
  },
  
  info: {
    main: '#06b6d4',
    dark: '#0891b2',
    light: 'rgba(6, 182, 212, 0.1)',
  },
  
  // Background Colors
  background: {
    main: '#0f172a',
    surface: '#1e293b',
    hover: '#334155',
  },
  
  // Text Colors
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#64748b',
  },
  
  // Border Colors
  border: {
    main: '#334155',
    light: '#475569',
  },
  
  // Glass Colors
  glass: {
    background: 'rgba(255, 255, 255, 0.1)',
    backgroundLight: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.2)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Legacy Colors (for compatibility)
  PRIMARY: '#3b82f6',
  PRIMARY_DARK: '#2563eb',
  PRIMARY_LIGHT: '#60a5fa',
  SECONDARY: '#6b7280',
  SUCCESS: '#22c55e',
  DANGER: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#06b6d4',
  BACKGROUND: '#0f172a',
  SURFACE: '#1e293b',
  TEXT_PRIMARY: '#f8fafc',
  TEXT_SECONDARY: '#cbd5e1',
  BORDER: '#334155',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  WHITE: '#ffffff',
  BLACK: '#000000',
  ERROR: '#ef4444',
};

// Glassmorphism Theme
export const GLASS_THEME = {
  // Glass Effects
  blur: {
    radius: 20,
  },
  border: {
    radius: 16,
  },
  
  // Gradients
  gradients: {
    primary: ['#3b82f6', '#8b5cf6'],
    secondary: ['#6b7280', '#9ca3af'],
    success: ['#22c55e', '#16a34a'],
    danger: ['#ef4444', '#dc2626'],
    warning: ['#f59e0b', '#d97706'],
    info: ['#06b6d4', '#0891b2'],
    background: ['rgba(101, 0, 94, 1)', 'rgba(60, 132, 206, 1)', 'rgba(48, 238, 226, 1)', 'rgba(255, 25, 25, 1)'],
  },
  
  // Shadows
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Glass Card Styles
  card: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: {
      small: 16,
      medium: 24,
      large: 32,
    },
  },
  
  // Legacy properties (for compatibility)
  BLUR_RADIUS: 20,
  BORDER_RADIUS: 16,
  GRADIENTS: {
    PRIMARY: ['#3b82f6', '#8b5cf6'],
    SECONDARY: ['#6b7280', '#9ca3af'],
    SUCCESS: ['#22c55e', '#16a34a'],
    DANGER: ['#ef4444', '#dc2626'],
    WARNING: ['#f59e0b', '#d97706'],
    INFO: ['#06b6d4', '#0891b2'],
    BACKGROUND: ['rgba(101, 0, 94, 1)', 'rgba(60, 132, 206, 1)', 'rgba(48, 238, 226, 1)', 'rgba(255, 25, 25, 1)'],
  },
  SHADOWS: {
    SMALL: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    MEDIUM: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    LARGE: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  CARD: {
    BACKGROUND: 'rgba(255, 255, 255, 0.1)',
    BORDER: 'rgba(255, 255, 255, 0.2)',
    BORDER_RADIUS: 16,
    PADDING: {
      SMALL: 16,
      MEDIUM: 24,
      LARGE: 32,
    },
  },
};

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};
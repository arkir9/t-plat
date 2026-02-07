// Professional Design System - T-Plat
export const theme = {
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#F5F0FF',
      100: '#EDE4FF', 
      200: '#DDD0FF',
      300: '#C4B0FF',
      400: '#A78BFF',
      500: '#8B5CF6', // Main brand purple
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    
    // Dark Theme (Default)
    dark: {
      background: '#000000',
      surface: '#1A1A1A',
      surfaceVariant: '#2A2A2A',
      surfaceElevated: '#1F1F1F',
      border: 'rgba(255, 255, 255, 0.1)',
      borderVariant: 'rgba(255, 255, 255, 0.05)',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      textTertiary: 'rgba(255, 255, 255, 0.5)',
      textDisabled: 'rgba(255, 255, 255, 0.3)',
    },
    
    // Light Theme
    light: {
      background: '#FFFFFF',
      surface: '#F8F9FA',
      surfaceVariant: '#F1F3F4',
      surfaceElevated: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.1)',
      borderVariant: 'rgba(0, 0, 0, 0.05)',
      text: '#1A1A1A',
      textSecondary: 'rgba(26, 26, 26, 0.7)',
      textTertiary: 'rgba(26, 26, 26, 0.5)',
      textDisabled: 'rgba(26, 26, 26, 0.3)',
    },
    
    // Semantic Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Gradients
    gradients: {
      primary: ['#8B5CF6', '#7C3AED'],
      primaryReverse: ['#7C3AED', '#8B5CF6'],
      dark: ['#000000', '#1A1A1A'],
      surface: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
      glow: ['#8B5CF6', '#A78BFF', '#8B5CF6'],
    },
    
    // Overlay Colors
    overlay: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      dark: 'rgba(0, 0, 0, 0.5)',
      darkStrong: 'rgba(0, 0, 0, 0.8)',
    },
  },
  
  typography: {
    // Font Families
    fonts: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      mono: 'Menlo',
      brand: 'System', // We'll use a custom font for the logo
    },
    
    // Font Sizes & Line Heights
    sizes: {
      xs: { fontSize: 12, lineHeight: 16 },
      sm: { fontSize: 14, lineHeight: 20 },
      base: { fontSize: 16, lineHeight: 24 },
      lg: { fontSize: 18, lineHeight: 28 },
      xl: { fontSize: 20, lineHeight: 28 },
      '2xl': { fontSize: 24, lineHeight: 32 },
      '3xl': { fontSize: 30, lineHeight: 36 },
      '4xl': { fontSize: 36, lineHeight: 40 },
      '5xl': { fontSize: 48, lineHeight: 1 },
      '6xl': { fontSize: 60, lineHeight: 1 },
    },
    
    // Text Styles
    styles: {
      heading1: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '700',
        letterSpacing: -0.5,
      },
      heading2: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '700',
        letterSpacing: -0.3,
      },
      heading3: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600',
        letterSpacing: -0.2,
      },
      subtitle: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
        letterSpacing: -0.1,
      },
      body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '400',
      },
      caption: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
      },
      label: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.32,
      shadowRadius: 5.46,
      elevation: 9,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
      elevation: 16,
    },
    // Brand Shadow (Purple glow)
    brand: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  
  animations: {
    timing: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  breakpoints: {
    sm: 375, // iPhone SE
    md: 414, // iPhone 11 Pro
    lg: 428, // iPhone 12 Pro Max
    xl: 768, // iPad
  },
} as const;

// Type definitions
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeBorderRadius = typeof theme.borderRadius;
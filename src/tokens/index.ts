/**
 * AXIOM PROTOCOL DESIGN TOKENS
 * Semantic design tokens for next-generation DeFi interface
 */

export const colors = {
  dark: {
    background: '#090B0E',
    backgroundSecondary: '#0E1116',
    surface: '#13171F',
    surfaceElevated: '#1A202C',
    surfaceHover: '#222938',
    surfaceActive: '#2A3346',
    
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textDisabled: '#475569',
    
    border: '#1E2638',
    borderSubtle: '#171E2E',
    borderStrong: '#2E3A52',
    
    primary: '#00D2B4', // Electric Precision Cyan-Teal
    primaryHover: '#00E8C7',
    primaryActive: '#00BFA3',
    primarySubtle: 'rgba(0, 210, 180, 0.12)',
    primaryGlow: 'rgba(0, 210, 180, 0.25)',
    
    success: '#10B981',
    successSubtle: 'rgba(16, 185, 129, 0.12)',
    warning: '#F59E0B',
    warningSubtle: 'rgba(245, 158, 11, 0.12)',
    error: '#F43F5E',
    errorSubtle: 'rgba(244, 63, 94, 0.12)',
    info: '#38BDF8',
    infoSubtle: 'rgba(56, 189, 248, 0.12)',
    
    tokenPositive: '#10B981',
    tokenNegative: '#F43F5E',
  },
  light: {
    background: '#F8FAFC',
    backgroundSecondary: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F8FAFC',
    surfaceActive: '#F1F5F9',
    
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textDisabled: '#CBD5E1',
    
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    borderStrong: '#CBD5E1',
    
    primary: '#009E87', // Tuned deeper for light mode high contrast
    primaryHover: '#008774',
    primaryActive: '#007060',
    primarySubtle: 'rgba(0, 158, 135, 0.10)',
    primaryGlow: 'rgba(0, 158, 135, 0.18)',
    
    success: '#059669',
    successSubtle: 'rgba(5, 150, 105, 0.10)',
    warning: '#D97706',
    warningSubtle: 'rgba(217, 119, 6, 0.10)',
    error: '#E11D48',
    errorSubtle: 'rgba(225, 29, 72, 0.10)',
    info: '#0284C7',
    infoSubtle: 'rgba(2, 132, 199, 0.10)',
    
    tokenPositive: '#059669',
    tokenNegative: '#E11D48',
  }
};

export const typography = {
  fontFamily: {
    sans: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  scale: {
    display: { size: '2.5rem', lineHeight: '1.15', weight: '700', tracking: '-0.025em' },
    h1: { size: '2rem', lineHeight: '1.2', weight: '700', tracking: '-0.02em' },
    h2: { size: '1.5rem', lineHeight: '1.25', weight: '600', tracking: '-0.015em' },
    h3: { size: '1.25rem', lineHeight: '1.3', weight: '600', tracking: '-0.01em' },
    bodyLarge: { size: '1.125rem', lineHeight: '1.5', weight: '400', tracking: '0' },
    body: { size: '1rem', lineHeight: '1.55', weight: '400', tracking: '0' },
    bodySmall: { size: '0.875rem', lineHeight: '1.5', weight: '400', tracking: '0' },
    caption: { size: '0.75rem', lineHeight: '1.4', weight: '500', tracking: '0.02em' },
    label: { size: '0.6875rem', lineHeight: '1.3', weight: '600', tracking: '0.04em' },
    numeric: { size: '1.5rem', lineHeight: '1.2', weight: '600', tracking: '-0.01em' },
  }
};

export const radius = {
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 12px -2px rgba(0, 0, 0, 0.25)',
  lg: '0 12px 24px -4px rgba(0, 0, 0, 0.35)',
  glow: '0 0 20px -2px rgba(0, 210, 180, 0.25)',
  inner: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.05)',
};

export const motionTokens = {
  fast: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
  standard: '220ms cubic-bezier(0.16, 1, 0.3, 1)',
  complex: '380ms cubic-bezier(0.16, 1, 0.3, 1)',
  ambient: '12000ms linear infinite',
};

export const breakpoints = {
  mobileSm: '360px',
  mobile: '390px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultra: '1440px',
};

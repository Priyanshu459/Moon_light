// Premium Color Palette for Moon Light
// Using a clean, Instagram-inspired light theme with bold accents

export const colors = {
  // Backgrounds
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#0A0A0A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Brand
  primary: '#6366F1',       // Indigo
  primaryLight: '#EEF2FF',
  secondary: '#3B82F6',     // Blue
  accent: '#A78BFA',        // Soft Purple

  // UI
  border: '#E5E7EB',
  divider: '#F3F4F6',
  placeholder: '#D1D5DB',

  // Semantic
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Gradients (used as start/end pairs)
  gradientStart: '#6366F1',
  gradientEnd: '#A78BFA',
};

export const typography = {
  // Font sizes
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body2: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.5 },
};

export const layout = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};

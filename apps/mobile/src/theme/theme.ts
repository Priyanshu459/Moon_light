// Moon Light — Premium Dark Theme
// Deep space navy with glowing indigo/violet accents

export const colors = {
  // Backgrounds — layered depth
  background:      '#0D0D1A',   // Deep space navy
  surface:         '#13131F',   // Card/panel surface
  surfaceElevated: '#1A1A2E',   // Elevated layer (modals, etc.)
  surfaceHover:    '#1F1F35',   // Hover / pressed state

  // Text
  textPrimary:   '#F0F0FF',     // Near-white with cool tint
  textSecondary: '#9090B8',     // Muted lavender
  textMuted:     '#55557A',     // Very muted
  textOnPrimary: '#FFFFFF',

  // Brand — glowing indigo + violet
  primary:      '#7C6FF7',      // Bright indigo-violet
  primaryLight: '#2A2550',      // Dimmed primary for backgrounds
  primaryGlow:  'rgba(124,111,247,0.25)',
  secondary:    '#A78BFA',      // Soft violet accent
  accent:       '#C084FC',      // Bright purple pop

  // UI
  border:      '#1E1E35',       // Subtle border
  borderBright: '#2E2E50',      // More visible border
  divider:     '#161628',

  // Semantic
  error:   '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  like:    '#F43F5E',           // Rose for likes
  share:   '#38BDF8',           // Sky for share

  // Gradients
  gradientStart: '#6366F1',
  gradientMid:   '#7C6FF7',
  gradientEnd:   '#A78BFA',
};

export const typography = {
  h1:      { fontSize: 30, fontWeight: '800' as const, lineHeight: 38, letterSpacing: -0.5 },
  h2:      { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3:      { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },
  h4:      { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  body2:   { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  label:   { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, letterSpacing: 0.8 },
};

export const layout = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius:  { xs: 4, sm: 8, md: 14, lg: 20, xl: 28, full: 9999 },
};

// Moon Light — Premium Dark Theme (Apple / Linear / Notion Inspired)
// Deep charcoal with elevated surfaces and a single premium purple accent

export const colors = {
  // Backgrounds — layered depth
  background:      '#0D0E14',   // Deep charcoal
  surface:         '#171822',   // Elevated layer (cards, modals)
  surfaceElevated: '#1F202E',   // Hover / Top layer
  surfaceHighlight:'#2A2B3D',   // Active state
  
  // Text
  textPrimary:   '#F2F2F5',     // Crisp near-white
  textSecondary: '#A0A2B3',     // Muted grey-blue
  textMuted:     '#66687A',     // Very muted
  textOnPrimary: '#FFFFFF',

  // Brand — premium purple
  primary:      '#7C5CFF',      // Premium purple accent
  primaryLight: 'rgba(124,92,255,0.15)', // Dimmed primary for backgrounds
  primaryGlow:  'rgba(124,92,255,0.3)',
  
  // UI Elements
  border:      '#222330',       // Subtle border
  borderBright: '#303245',      // More visible border
  divider:     '#1A1B26',

  // Semantic
  error:   '#FF453A',
  success: '#32D74B',
  warning: '#FF9F0A',
  like:    '#FF3B30',           // Apple-like red for likes
  share:   '#0A84FF',           // Apple-like blue for share
};

// System fonts mapping
const fontStack = 'System'; // React Native uses system fonts automatically when family is omitted or 'System'

export const typography = {
  h1:      { fontSize: 32, fontWeight: '800' as const, lineHeight: 40, letterSpacing: -0.5 },
  h2:      { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
  h3:      { fontSize: 20, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
  h4:      { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, letterSpacing: -0.1 },
  body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body2:   { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  label:   { fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};

export const layout = {
  // Strict 8pt grid system
  spacing: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40 },
  // Smooth rounded corners
  radius:  { xs: 8, sm: 12, md: 18, lg: 24, xl: 32, full: 9999 },
};

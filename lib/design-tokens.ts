export const colors = {
  navy: {
    50: '#EEF2F7',
    100: '#D6DFEA',
    200: '#ACBED3',
    300: '#7E97B5',
    400: '#547490',
    500: '#325571',
    600: '#234059',
    700: '#1F3A57',
    800: '#142940',
    900: '#0B1A2B',
  },
  gold: {
    50: '#FBF7EE',
    100: '#F4EBD4',
    200: '#E7D3A0',
    300: '#D8BB7C',
    400: '#CFB075',
    500: '#C8A668',
    600: '#A98851',
    700: '#87693C',
    800: '#5F4926',
    900: '#3E2F18',
  },
  sand: {
    50: '#FAF6EE',
    100: '#F5EFE6',
    200: '#ECE3CE',
    300: '#DFD2B0',
    400: '#C9B98E',
  },
  ink: {
    DEFAULT: '#0B1A2B',
    muted: '#4B5C70',
    subtle: '#7A8899',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    muted: '#FAF6EE',
    sunken: '#F5EFE6',
  },
  line: {
    DEFAULT: '#E6DECB',
    strong: '#D6CBAF',
  },
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#1F3A57',
  white: '#FFFFFF',
  black: '#000000',
} as const

export const brand = {
  primary: colors.navy[700],
  primaryHover: colors.navy[800],
  accent: colors.gold[500],
  accentHover: colors.gold[600],
  surface: colors.sand[100],
  ink: colors.ink.DEFAULT,
} as const

export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    display: '"Playfair Display", ui-serif, Georgia, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export const radius = {
  xs: 3,
  sm: 5,
  md: 8,
  lg: 14,
  xl: 18,
  pill: 9999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const

export const shadow = {
  sm: '0 1px 2px rgba(11, 26, 43, 0.06)',
  md: '0 8px 20px -4px rgba(11, 26, 43, 0.10)',
  lg: '0 16px 32px -8px rgba(11, 26, 43, 0.14)',
} as const

export const designTokens = {
  colors,
  brand,
  typography,
  radius,
  spacing,
  shadow,
} as const

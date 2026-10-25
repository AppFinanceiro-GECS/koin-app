// Paleta da marca (mesma do web: tailwind.config.js do monorepo antigo)
export const colors = {
  navy: '#1E3A5F',
  navyDark: '#102a43',
  navyLight: '#334e68',
  green: '#4ade80',
  greenDark: '#22c55e',
  income: '#16a34a',
  expense: '#dc2626',
  warning: '#d97706',
  background: '#f0f4f8',
  surface: '#ffffff',
  border: '#d9e2ec',
  text: '#102a43',
  textMuted: '#627d98',
  white: '#ffffff',
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const

// Tema escuro (Figma: Desktop / 01 · Autenticação e convite)
export const darkTheme = {
  background: '#080512',
  surface: '#120e1e',
  surfaceSecondary: '#1b152b',
  border: '#2b233c',
  borderFocus: '#7c3aed',
  primary: '#7c3aed',
  primaryPressed: '#6d28d9',
  accent: '#a78bfa',
  accentLight: '#ddd6fe',
  text: '#f8fafc',
  textSecondary: '#a7a1b7',
  textMuted: '#625975',
  error: '#f43f5e',
  errorBackground: '#2a121d',
  errorBorder: '#881337',
  success: '#34d399',
  successBackground: '#0a291f',
  successBorder: '#065f46',
} as const

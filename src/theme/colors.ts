// Paleta da marca (mesma do web: tailwind.config.js do monorepo antigo)
export const colors = {
  navy: '#1E3A5F',
  navyDark: '#102a43',
  navyLight: '#334e68',
  // verde vivo: só superfícies e ícones grandes (1,74:1 sobre branco, reprova para texto)
  green: '#4ade80',
  greenDark: '#22c55e',
  income: '#15803d', // 5,0:1 sobre branco
  expense: '#b91c1c', // 6,5:1
  warning: '#b45309', // 5,0:1
  background: '#f0f4f8',
  surface: '#ffffff',
  border: '#d9e2ec',
  text: '#102a43',
  textMuted: '#52677f', // 5,3:1 sobre o fundo
  white: '#ffffff',
} as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const

// Tema escuro (Figma: Desktop / 01 · Autenticação e convite)
// Contraste WCAG AA (texto normal ≥ 4,5:1) sobre background / surface / surfaceSecondary:
//   text 19,3 · textSecondary 8,1 · textMuted 5,5 · accent 7,4 · success 10,5 · warning 9,4 · error 5,5
//   primary como texto só em tamanho grande (≥ 18,66 px em negrito, 3,5:1); em texto pequeno use accent
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
  // ≥ 4,5:1 sobre background, surface e surfaceSecondary (era #625975: 2,7 a 3,1)
  textMuted: '#8a819e',
  error: '#f43f5e',
  errorBackground: '#2a121d',
  errorBorder: '#881337',
  success: '#34d399',
  successBackground: '#0a291f',
  successBorder: '#065f46',
  warning: '#f59e0b',
  warningBackground: '#2a1f0a',
  warningBorder: '#92400e',
} as const

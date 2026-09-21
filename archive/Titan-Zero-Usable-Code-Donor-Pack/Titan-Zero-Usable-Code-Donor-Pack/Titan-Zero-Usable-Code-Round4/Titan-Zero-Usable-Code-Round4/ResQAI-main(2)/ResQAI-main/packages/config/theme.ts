export const THEME = {
  colors: {
    accent: 'var(--accent)',
    bgPrimary: 'var(--bg-primary)',
    bgSecondary: 'var(--bg-secondary)',
    border: 'var(--border)',
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    good: 'var(--good)',
    warn: 'var(--warn)',
    bad: 'var(--bad)',
    plain: 'var(--plain)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontSize: {
    sm: 12,
    md: 13,
    lg: 14,
    xl: 16,
    title: 18,
  },
} as const;

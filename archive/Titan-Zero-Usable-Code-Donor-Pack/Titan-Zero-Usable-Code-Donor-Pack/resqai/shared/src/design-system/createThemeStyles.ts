import type { CSSProperties } from 'react';
import type { Theme } from './ThemeProvider';
import { typography, radius, spacing, borders } from './tokens';

export interface ThemeStyles {
  layout: CSSProperties;
  surface: CSSProperties;
  surfaceElevated: CSSProperties;
  surfaceInteractive: CSSProperties;
  text: {
    primary: CSSProperties;
    secondary: CSSProperties;
    muted: CSSProperties;
    heading: CSSProperties;
    label: CSSProperties;
    caption: CSSProperties;
  };
  input: CSSProperties;
  divider: CSSProperties;
  focusRing: CSSProperties;
}

export function createThemeStyles(theme: Theme): ThemeStyles {
  const { colors, elevation } = theme;
  return {
    layout: {
      backgroundColor: colors.background.page,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.normal,
      minHeight: '100vh',
    },
    surface: {
      backgroundColor: colors.background.card,
      border: `${borders.width.thin} ${borders.style.solid} ${colors.border.default}`,
      borderRadius: radius.lg,
    },
    surfaceElevated: {
      backgroundColor: colors.background.elevated,
      boxShadow: elevation[2],
      borderRadius: radius.lg,
    },
    surfaceInteractive: {
      backgroundColor: colors.background.card,
      border: `${borders.width.thin} ${borders.style.solid} ${colors.border.default}`,
      borderRadius: radius.lg,
      cursor: 'pointer',
      transition: `box-shadow ${theme.mode === 'dark' ? '300ms' : '200ms'} ease, border-color 200ms ease`,
    },
    text: {
      primary: {
        color: colors.text.primary,
        fontFamily: typography.fontFamily.body,
      },
      secondary: {
        color: colors.text.secondary,
        fontFamily: typography.fontFamily.body,
      },
      muted: {
        color: colors.text.muted,
        fontFamily: typography.fontFamily.body,
      },
      heading: {
        color: colors.text.primary,
        fontFamily: typography.fontFamily.heading,
        fontWeight: typography.fontWeight.semibold,
      },
      label: {
        color: colors.text.secondary,
        fontFamily: typography.fontFamily.body,
        fontWeight: typography.fontWeight.medium,
        fontSize: typography.fontSize.sm,
      },
      caption: {
        color: colors.text.muted,
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
      },
    },
    input: {
      backgroundColor: colors.background.input,
      border: `${borders.width.thin} ${borders.style.solid} ${colors.border.default}`,
      borderRadius: radius.md,
      color: colors.text.primary,
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.sm,
      padding: `${spacing[2]} ${spacing[3]}`,
      outline: 'none',
      transition: `border-color 200ms ease, box-shadow 200ms ease`,
    },
    divider: {
      border: 'none',
      borderTop: `${borders.width.thin} ${borders.style.solid} ${colors.border.divider}`,
      margin: 0,
    },
    focusRing: {
      outline: 'none',
      borderColor: colors.border.focus,
      boxShadow: `0 0 0 3px ${theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.15)'}`,
    },
  };
}

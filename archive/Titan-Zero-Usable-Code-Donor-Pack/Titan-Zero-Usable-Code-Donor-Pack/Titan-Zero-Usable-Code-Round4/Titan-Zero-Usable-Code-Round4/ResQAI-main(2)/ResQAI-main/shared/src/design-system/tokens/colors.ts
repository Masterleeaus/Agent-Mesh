export interface ColorTokens {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  background: ColorBackgroundTokens;
  text: ColorTextTokens;
  border: ColorBorderTokens;
  status: ColorStatusTokens;
  supporting: ColorSupportingTokens;
}

export interface ColorBackgroundTokens {
  page: string;
  card: string;
  elevated: string;
  overlay: string;
  input: string;
  sidebar: string;
  topbar: string;
  tooltip: string;
}

export interface ColorTextTokens {
  primary: string;
  secondary: string;
  muted: string;
  inverse: string;
  link: string;
  linkHover: string;
  placeholder: string;
  disabled: string;
}

export interface ColorBorderTokens {
  default: string;
  light: string;
  hover: string;
  focus: string;
  disabled: string;
  divider: string;
}

export interface ColorStatusTokens {
  success: string;
  successLight: string;
  successDark: string;
  warning: string;
  warningLight: string;
  warningDark: string;
  error: string;
  errorLight: string;
  errorDark: string;
  info: string;
  infoLight: string;
  infoDark: string;
}

export interface ColorSupportingTokens {
  blue: string;
  indigo: string;
  purple: string;
  pink: string;
  orange: string;
  teal: string;
  cyan: string;
  lime: string;
}

export const lightColors: ColorTokens = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryActive: '#1e40af',
  primaryLight: '#dbeafe',
  primaryDark: '#1e3a5f',
  secondary: '#64748b',
  secondaryHover: '#475569',
  secondaryActive: '#334155',
  accent: '#8b5cf6',
  accentHover: '#7c3aed',
  accentActive: '#6d28d9',
  background: {
    page: '#f8fafc',
    card: '#ffffff',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
    input: '#ffffff',
    sidebar: '#1e293b',
    topbar: '#ffffff',
    tooltip: '#1e293b',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
    link: '#2563eb',
    linkHover: '#1d4ed8',
    placeholder: '#94a3b8',
    disabled: '#cbd5e1',
  },
  border: {
    default: '#e2e8f0',
    light: '#f1f5f9',
    hover: '#cbd5e1',
    focus: '#2563eb',
    disabled: '#e2e8f0',
    divider: '#e2e8f0',
  },
  status: {
    success: '#16a34a',
    successLight: '#dcfce7',
    successDark: '#15803d',
    warning: '#d97706',
    warningLight: '#fef3c7',
    warningDark: '#b45309',
    error: '#dc2626',
    errorLight: '#fee2e2',
    errorDark: '#b91c1c',
    info: '#2563eb',
    infoLight: '#dbeafe',
    infoDark: '#1d4ed8',
  },
  supporting: {
    blue: '#3b82f6',
    indigo: '#6366f1',
    purple: '#a855f7',
    pink: '#ec4899',
    orange: '#f97316',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    lime: '#65a30d',
  },
};

export const darkColors: ColorTokens = {
  primary: '#3b82f6',
  primaryHover: '#60a5fa',
  primaryActive: '#93c5fd',
  primaryLight: '#1e3a5f',
  primaryDark: '#dbeafe',
  secondary: '#94a3b8',
  secondaryHover: '#cbd5e1',
  secondaryActive: '#e2e8f0',
  accent: '#a78bfa',
  accentHover: '#c4b5fd',
  accentActive: '#ddd6fe',
  background: {
    page: '#0f172a',
    card: '#1e293b',
    elevated: '#334155',
    overlay: 'rgba(0, 0, 0, 0.7)',
    input: '#334155',
    sidebar: '#0f172a',
    topbar: '#1e293b',
    tooltip: '#f8fafc',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    muted: '#64748b',
    inverse: '#0f172a',
    link: '#60a5fa',
    linkHover: '#93c5fd',
    placeholder: '#64748b',
    disabled: '#475569',
  },
  border: {
    default: '#334155',
    light: '#1e293b',
    hover: '#475569',
    focus: '#3b82f6',
    disabled: '#334155',
    divider: '#334155',
  },
  status: {
    success: '#22c55e',
    successLight: '#052e16',
    successDark: '#16a34a',
    warning: '#f59e0b',
    warningLight: '#451a03',
    warningDark: '#d97706',
    error: '#ef4444',
    errorLight: '#450a0a',
    errorDark: '#dc2626',
    info: '#3b82f6',
    infoLight: '#172554',
    infoDark: '#2563eb',
  },
  supporting: {
    blue: '#60a5fa',
    indigo: '#818cf8',
    purple: '#c084fc',
    pink: '#f472b6',
    orange: '#fb923c',
    teal: '#2dd4bf',
    cyan: '#22d3ee',
    lime: '#84cc16',
  },
};

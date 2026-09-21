import type { CSSProperties, ReactNode } from 'react';

export interface AppLink {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  description?: string;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
}

export interface ApplicationSwitcherProps {
  apps: AppLink[];
  currentAppId?: string;
  onSelect: (app: AppLink) => void;
  label?: string;
  compact?: boolean;
  style?: CSSProperties;
  className?: string;
}

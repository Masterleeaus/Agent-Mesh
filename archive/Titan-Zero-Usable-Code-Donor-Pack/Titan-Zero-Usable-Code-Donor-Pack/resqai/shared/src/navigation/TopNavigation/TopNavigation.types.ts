import type { CSSProperties, ReactNode } from 'react';

export interface TopNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  active?: boolean;
  disabled?: boolean;
  href?: string;
  children?: TopNavItem[];
}

export interface TopNavigationProps {
  items: TopNavItem[];
  activeId?: string;
  onSelect: (item: TopNavItem) => void;
  style?: CSSProperties;
  className?: string;
}

import type { CSSProperties, ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavItem[];
  divider?: boolean;
}

export interface NavigationProps {
  items: NavItem[];
  activeId?: string;
  onNavigate: (item: NavItem) => void;
  variant?: 'vertical' | 'horizontal';
  compact?: boolean;
  style?: CSSProperties;
  className?: string;
  itemStyle?: CSSProperties;
  activeItemStyle?: CSSProperties;
}

import type { CSSProperties, ReactNode, MouseEvent } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeVariant?: 'info' | 'warning' | 'error' | 'success';
  disabled?: boolean;
  children?: SidebarItem[];
  href?: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  onNavigate: (item: SidebarItem) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  header?: ReactNode;
  footer?: ReactNode;
  logo?: ReactNode;
  title?: string;
  width?: number;
  collapsedWidth?: number;
  style?: CSSProperties;
  className?: string;
  itemStyle?: CSSProperties;
  activeItemStyle?: CSSProperties;
}

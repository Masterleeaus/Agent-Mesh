import type { CSSProperties, ReactNode } from 'react';

export interface RoleNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  roles?: string[];
  permissions?: string[];
  children?: RoleNavItem[];
  badge?: string | number;
  divider?: boolean;
}

export interface RoleAwareNavProps {
  items: RoleNavItem[];
  userRoles: string[];
  userPermissions: string[];
  activeId?: string;
  onNavigate: (item: RoleNavItem) => void;
  fallback?: ReactNode;
  variant?: 'vertical' | 'horizontal';
  style?: CSSProperties;
  className?: string;
}

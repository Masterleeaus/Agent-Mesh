import type { CSSProperties, ReactNode } from 'react';

export interface RoleGuardProps {
  roles: string[];
  userRoles: string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

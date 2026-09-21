import type { CSSProperties, ReactNode } from 'react';

export interface PermissionGuardProps {
  permissions: string[];
  userPermissions: string[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

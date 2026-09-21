import { type ReactNode } from 'react';

interface PermissionGuardProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const userPermissionsStr = localStorage.getItem('user_permissions');
  const userPermissions = userPermissionsStr ? JSON.parse(userPermissionsStr) : ['*'];

  if (userPermissions.includes('*') || userPermissions.includes(permission)) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;
  return null;
}

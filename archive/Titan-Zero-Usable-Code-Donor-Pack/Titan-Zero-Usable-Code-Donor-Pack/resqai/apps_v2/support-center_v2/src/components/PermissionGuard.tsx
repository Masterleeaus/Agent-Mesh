import { type FC, type ReactNode } from 'react';
import { useAppContext } from '../state/AppContext';
import type { SupportCenterPermission } from '../contracts/permissions';

interface PermissionGuardProps {
  permission: SupportCenterPermission;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: FC<PermissionGuardProps> = ({ permission, fallback = null, children }) => {
  const { currentUserPermissions } = useAppContext();
  const hasPermission = currentUserPermissions.includes(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

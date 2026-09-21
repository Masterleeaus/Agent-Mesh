import { type FC, type ReactNode } from 'react';
import { useAppContext } from '../state/AppContext';
import type { ResolutionCenterPermission } from '../contracts/permissions';

interface PermissionGuardProps {
  permission: ResolutionCenterPermission;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: FC<PermissionGuardProps> = ({ permission, fallback = null, children }) => {
  const { currentUserPermissions } = useAppContext();
  const hasPermission = currentUserPermissions.includes(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

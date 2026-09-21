import { type FC, type ReactNode } from 'react';

interface PermissionGuardProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: FC<PermissionGuardProps> = ({ permission, fallback = null, children }) => {
  return <>{children}</>;
};

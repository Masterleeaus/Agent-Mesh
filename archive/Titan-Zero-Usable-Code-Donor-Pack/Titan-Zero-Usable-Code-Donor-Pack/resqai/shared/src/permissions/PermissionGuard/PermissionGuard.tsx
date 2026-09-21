import { useMemo, type FC } from 'react';
import type { PermissionGuardProps } from './PermissionGuard.types';

export const PermissionGuard: FC<PermissionGuardProps> = ({ permissions, userPermissions, mode = 'any', fallback = null, children, style, className }) => {
  const hasAccess = useMemo(() => {
    if (mode === 'any') return permissions.some(p => userPermissions.includes(p));
    return permissions.every(p => userPermissions.includes(p));
  }, [permissions, userPermissions, mode]);

  if (!hasAccess) return <>{fallback}</>;
  return <div style={style} className={className}>{children}</div>;
};

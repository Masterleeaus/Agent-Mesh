import { useMemo, type FC } from 'react';
import type { RoleGuardProps } from './RoleGuard.types';

export const RoleGuard: FC<RoleGuardProps> = ({ roles, userRoles, mode = 'any', fallback = null, children, style, className }) => {
  const hasAccess = useMemo(() => {
    if (mode === 'any') return roles.some(r => userRoles.includes(r));
    return roles.every(r => userRoles.includes(r));
  }, [roles, userRoles, mode]);

  if (!hasAccess) return <>{fallback}</>;
  return <div style={style} className={className}>{children}</div>;
};

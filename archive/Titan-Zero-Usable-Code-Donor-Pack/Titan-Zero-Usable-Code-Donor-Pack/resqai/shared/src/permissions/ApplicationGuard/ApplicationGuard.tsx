import { useMemo, type FC } from 'react';
import type { ApplicationGuardProps } from './ApplicationGuard.types';

export const ApplicationGuard: FC<ApplicationGuardProps> = ({ application, allowedApplications, fallback = null, children, style, className }) => {
  const hasAccess = useMemo(() => allowedApplications.includes(application), [application, allowedApplications]);

  if (!hasAccess) return <>{fallback}</>;
  return <div style={style} className={className}>{children}</div>;
};

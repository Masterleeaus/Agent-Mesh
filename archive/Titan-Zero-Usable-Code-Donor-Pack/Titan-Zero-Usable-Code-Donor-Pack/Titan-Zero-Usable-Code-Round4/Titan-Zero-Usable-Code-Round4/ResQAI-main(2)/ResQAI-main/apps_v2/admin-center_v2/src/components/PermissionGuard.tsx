import { type FC, type ReactNode } from 'react';

const deniedStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 64, gap: 16, textAlign: 'center' };
const iconStyle: React.CSSProperties = { fontSize: 48, color: '#8b9bb5' };
const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: '#e6ecf5' };
const descStyle: React.CSSProperties = { fontSize: 14, color: '#8b9bb5', maxWidth: 400 };

interface PermissionGuardProps { permission: string; fallback?: ReactNode; children: ReactNode; }

export const PermissionGuard: FC<PermissionGuardProps> = ({ permission, fallback, children }) => {
  const userPermissions: string[] = [];
  const hasPermission = userPermissions.length === 0 || userPermissions.includes(permission) || userPermissions.includes('admin:*');

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : (
      <div style={deniedStyle}>
        <div style={iconStyle}>🔒</div>
        <div style={titleStyle}>Permission Denied</div>
        <div style={descStyle}>You do not have the required permission ({permission}) to access this section.</div>
      </div>
    );
  }

  return <>{children}</>;
};

import { type FC } from 'react';
import { StatusBadge } from '@resqai/foundation';

const bellStyle: React.CSSProperties = { position: 'relative', cursor: 'pointer', fontSize: 20, color: '#8b9bb5', padding: 4 };

export const NotificationBell: FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => (
  <div style={bellStyle} onClick={onClick}>
    🔔
    {count > 0 && <span style={{ position: 'absolute', top: 0, right: -4, fontSize: 10 }}>
      <StatusBadge variant="error" size="sm">{count > 99 ? '99+' : count}</StatusBadge>
    </span>}
  </div>
);

import { type FC } from 'react';
import { Table, Button } from '@resqai/foundation';
import type { SessionDTO } from '../models';

export const ActiveSessionList: FC<{ data: SessionDTO[]; loading: boolean; onForceLogout: (id: string) => void; }> = ({ data, loading, onForceLogout }) => (
  <Table
    columns={[
      { key: 'user', header: 'User', render: (_v: unknown, r: SessionDTO) => r.userName, sortable: true },
      { key: 'ip', header: 'IP', render: (_v: unknown, r: SessionDTO) => r.ipAddress },
      { key: 'started', header: 'Started', render: (_v: unknown, r: SessionDTO) => new Date(r.startedAt).toLocaleString() },
      { key: 'expires', header: 'Expires', render: (_v: unknown, r: SessionDTO) => new Date(r.expiresAt).toLocaleString() },
      { key: 'actions', header: '', render: (_v: unknown, r: SessionDTO) => <Button size="sm" variant="danger" onClick={() => onForceLogout(r.id)}>Force Logout</Button> },
    ]}
    data={data.map(d => ({ ...d, id: d.id }))}
    loading={loading}
    emptyMessage="No active sessions"
  />
);

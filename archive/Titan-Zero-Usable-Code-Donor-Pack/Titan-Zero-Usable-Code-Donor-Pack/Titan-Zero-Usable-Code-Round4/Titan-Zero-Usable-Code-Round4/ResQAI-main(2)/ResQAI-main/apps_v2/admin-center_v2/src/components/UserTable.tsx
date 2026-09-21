import { type FC } from 'react';
import { Table, SearchBar } from '@resqai/foundation';
import type { UserDTO } from '../models';

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 };

export const UserTable: FC<{ data: UserDTO[]; loading: boolean; search: string; onSearch: (v: string) => void; onRowClick: (id: string) => void; }> = ({ data, loading, search, onSearch, onRowClick }) => (
  <div>
    <div style={headerStyle}>
      <div style={{ flex: 1, maxWidth: 320 }}><SearchBar value={search} onChange={onSearch} placeholder="Search users..." /></div>
    </div>
    <Table
      columns={[
        { key: 'name', header: 'Name', render: (_v: unknown, r: UserDTO) => r.name, sortable: true },
        { key: 'email', header: 'Email', render: (_v: unknown, r: UserDTO) => r.email },
        { key: 'role', header: 'Role', render: (_v: unknown, r: UserDTO) => r.role, sortable: true },
        { key: 'status', header: 'Status', render: (_v: unknown, r: UserDTO) => r.status },
        { key: 'lastLogin', header: 'Last Login', render: (_v: unknown, r: UserDTO) => r.lastLogin ? new Date(r.lastLogin).toLocaleDateString() : '—' },
      ]}
      data={data.map(d => ({ ...d, id: d.id }))}
      loading={loading}
      emptyMessage="No users found"
      onRowClick={r => onRowClick(r.id as string)}
      sortable
    />
  </div>
);

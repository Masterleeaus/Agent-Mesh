import { type FC } from 'react';
import { Table, SearchBar } from '@resqai/foundation';
import type { AuditLogEntryDTO } from '../models';

const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 };

export const AuditLogTable: FC<{ data: AuditLogEntryDTO[]; loading: boolean; search: string; onSearch: (v: string) => void; }> = ({ data, loading, search, onSearch }) => (
  <div>
    <div style={headerStyle}>
      <div style={{ flex: 1, maxWidth: 320 }}><SearchBar value={search} onChange={onSearch} placeholder="Search audit log..." /></div>
    </div>
    <Table
      columns={[
        { key: 'timestamp', header: 'Time', render: (_v: unknown, r: AuditLogEntryDTO) => new Date(r.timestamp).toLocaleString(), sortable: true },
        { key: 'action', header: 'Action', render: (_v: unknown, r: AuditLogEntryDTO) => r.action },
        { key: 'actor', header: 'Actor', render: (_v: unknown, r: AuditLogEntryDTO) => r.actorName, sortable: true },
        { key: 'target', header: 'Target', render: (_v: unknown, r: AuditLogEntryDTO) => r.targetLabel },
        { key: 'details', header: 'Details', render: (_v: unknown, r: AuditLogEntryDTO) => r.details },
        { key: 'ip', header: 'IP', render: (_v: unknown, r: AuditLogEntryDTO) => r.ipAddress },
      ]}
      data={data.map(d => ({ ...d, id: d.id }))}
      loading={loading}
      emptyMessage="No audit entries"
      sortable
    />
  </div>
);

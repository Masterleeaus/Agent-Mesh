import { useState } from 'react';
import { useOrganizations } from '../hooks/useOrganizations';
import { Card, Table, Button, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { OrganizationDTO } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

const planVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = { enterprise: 'success', professional: 'warning', starter: 'neutral', free: 'info' };

export function OrganizationsPage() {
  const { data, loading, error, refetch } = useOrganizations();

  if (error) return <ErrorState title="Failed to load organizations" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Organizations</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No organizations" description="No organizations registered." />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Organization', render: (_v: unknown, r: OrganizationDTO) => r.name, sortable: true },
            { key: 'slug', header: 'Slug', render: (_v: unknown, r: OrganizationDTO) => r.slug },
            { key: 'plan', header: 'Plan', render: (_v: unknown, r: OrganizationDTO) => <StatusBadge variant={planVariant[r.plan]} size="sm">{r.plan}</StatusBadge> },
            { key: 'owner', header: 'Owner', render: (_v: unknown, r: OrganizationDTO) => r.ownerName },
            { key: 'users', header: 'Users', render: (_v: unknown, r: OrganizationDTO) => r.userCount, sortable: true },
            { key: 'apps', header: 'Apps', render: (_v: unknown, r: OrganizationDTO) => r.appCount, sortable: true },
            { key: 'status', header: 'Status', render: (_v: unknown, r: OrganizationDTO) => r.status },
            { key: 'created', header: 'Created', render: (_v: unknown, r: OrganizationDTO) => new Date(r.createdAt).toLocaleDateString() },
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No organizations"
          sortable
        />
      )}
    </div>
  );
}

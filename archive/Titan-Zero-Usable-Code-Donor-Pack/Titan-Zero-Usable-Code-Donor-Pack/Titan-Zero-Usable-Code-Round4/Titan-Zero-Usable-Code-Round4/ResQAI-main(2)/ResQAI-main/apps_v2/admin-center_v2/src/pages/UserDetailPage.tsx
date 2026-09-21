import { useState } from 'react';
import { useUserDetail } from '../hooks/useUserDetail';
import { Card, Tabs, StatusBadge, Table, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { UserDetailVM, SessionVM, ActivityVM } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const subtitleStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 13 };
const infoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 };
const infoLabel: React.CSSProperties = { color: '#8b9bb5', fontSize: 12 };
const infoValue: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 500 };
const backStyle: React.CSSProperties = { color: '#41d1c4', fontSize: 13, cursor: 'pointer', textDecoration: 'none' };

export function UserDetailPage({ userId }: { userId: string }) {
  const { data, loading, error } = useUserDetail(userId);
  const [activeTab, setActiveTab] = useState('profile');

  const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { active: 'success', pending: 'warning', suspended: 'error', inactive: 'neutral' };

  if (loading) return <div style={pageStyle}><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (error) return <ErrorState title="Failed to load user" message={error} />;
  if (!data) return <EmptyState title="User not found" description={`No user found with ID: ${userId}`} />;

  return (
    <div style={pageStyle}>
      <div><a style={backStyle} onClick={() => { window.location.hash = '#/users'; }}>← Back to Users</a></div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 }}>
        <div style={headerStyle}>
          <div>
            <div style={titleStyle}>{data.name}</div>
            <div style={subtitleStyle}>{data.email}</div>
          </div>
          <StatusBadge variant={statusVariant[data.status] || 'neutral'}>{data.status}</StatusBadge>
        </div>
        <div style={infoGrid as React.CSSProperties}>
          <div><div style={infoLabel}>Role</div><div style={infoValue}>{data.role}</div></div>
          <div><div style={infoLabel}>Last Login</div><div style={infoValue}>{data.lastLogin ? new Date(data.lastLogin).toLocaleString() : 'Never'}</div></div>
          <div><div style={infoLabel}>Created</div><div style={infoValue}>{new Date(data.createdAt).toLocaleDateString()}</div></div>
          <div><div style={infoLabel}>App Access</div><div style={infoValue}>{data.appAccess.join(', ') || 'None'}</div></div>
        </div>
      </Card>
      <Tabs
        tabs={[
          { id: 'profile', label: 'Profile' }, { id: 'roles', label: 'Roles' },
          { id: 'activity', label: 'Activity', badge: data.activity.length }, { id: 'sessions', label: 'Sessions', badge: data.sessions.length },
        ]}
        activeId={activeTab} onChange={setActiveTab}
      />
      {activeTab === 'profile' && <ProfileTab data={data} />}
      {activeTab === 'roles' && <RolesTab role={data.role} />}
      {activeTab === 'activity' && <ActivityTab activities={data.activity} />}
      {activeTab === 'sessions' && <SessionsTab sessions={data.sessions} />}
    </div>
  );
}

function ProfileTab({ data }: { data: UserDetailVM }) {
  return (
    <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 }}>
      <div style={infoGrid as React.CSSProperties}>
        <div><div style={infoLabel}>User ID</div><div style={{ ...infoValue, color: '#8b9bb5', fontFamily: 'monospace' }}>{data.id}</div></div>
        <div><div style={infoLabel}>Email</div><div style={infoValue}>{data.email}</div></div>
        <div><div style={infoLabel}>Updated</div><div style={infoValue}>{new Date(data.updatedAt).toLocaleString()}</div></div>
      </div>
    </Card>
  );
}

function RolesTab({ role }: { role: string }) {
  return (
    <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 }}>
      <div style={{ color: '#e6ecf5', fontSize: 14 }}>Current Role: <strong>{role}</strong></div>
    </Card>
  );
}

function ActivityTab({ activities }: { activities: ActivityVM[] }) {
  if (activities.length === 0) return <EmptyState title="No activity" description="No recent activity recorded." />;
  return (
    <Table
      columns={[
        { key: 'action', header: 'Action', render: (_v: unknown, r: ActivityVM) => r.action },
        { key: 'target', header: 'Target', render: (_v: unknown, r: ActivityVM) => r.target },
        { key: 'time', header: 'Time', render: (_v: unknown, r: ActivityVM) => new Date(r.timestamp).toLocaleString() },
      ]}
      data={activities.map(a => ({ ...a, id: a.id }))}
      emptyMessage="No activity"
    />
  );
}

function SessionsTab({ sessions }: { sessions: SessionVM[] }) {
  if (sessions.length === 0) return <EmptyState title="No sessions" description="No active sessions." />;
  return (
    <Table
      columns={[
        { key: 'ip', header: 'IP', render: (_v: unknown, r: SessionVM) => r.ipAddress },
        { key: 'agent', header: 'User Agent', render: (_v: unknown, r: SessionVM) => r.userAgent },
        { key: 'started', header: 'Started', render: (_v: unknown, r: SessionVM) => new Date(r.startedAt).toLocaleString() },
        { key: 'activity', header: 'Last Activity', render: (_v: unknown, r: SessionVM) => new Date(r.lastActivity).toLocaleString() },
      ]}
      data={sessions.map(s => ({ ...s, id: s.id }))}
      emptyMessage="No sessions"
    />
  );
}

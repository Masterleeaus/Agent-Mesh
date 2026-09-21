import { useState } from 'react';
import { useAccountDetail } from '../../hooks/useAccountDetail';
import { Card, Tabs, StatusBadge, Button, Skeleton, EmptyState, ErrorState } from '../../../../shared/src/components';
import type { Tab } from '../../../../shared/src/components';
import { DetailLayout } from '../../../../shared/src/layouts';
import { HealthGauge, AccountTimeline, AccountQuickActions } from '../../components';
import { navigate } from '../../state/AppContext';
import type { HealthStatus, RiskLevel } from '../../models/dto';

function healthVariant(s: HealthStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (s) { case 'healthy': return 'success'; case 'warning': return 'warning'; case 'critical': return 'error'; default: return 'neutral'; }
}

function riskVariant(r: RiskLevel): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (r) { case 'critical': case 'high': return 'error'; case 'medium': return 'warning'; case 'low': return 'success'; default: return 'neutral'; }
}

const tabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'followups', label: 'Followups' },
  { id: 'activity', label: 'Activity' },
];

interface AccountDetailPageProps {
  id: string;
}

export default function AccountDetailPage({ id }: AccountDetailPageProps) {
  const { data, loading, error } = useAccountDetail(id);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Skeleton variant="card" height={300} />
          <Skeleton variant="card" height={300} />
        </div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={() => window.location.reload()} title="Failed to load account" /></div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}><EmptyState title="Account not found" description={`No account found with ID ${id}.`} action={<Button variant="primary" onClick={() => navigate('/accounts')}>Back to Accounts</Button>} /></div>;
  }

  return (
    <DetailLayout
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="ghost" size="sm" onClick={() => navigate('/accounts')}>← Back</Button>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>{data.name}</h1>
              <StatusBadge variant={healthVariant(data.healthStatus)}>{data.healthStatus}</StatusBadge>
            </div>
            <div style={{ fontSize: 13, color: '#8b9bb5', marginTop: 4 }}>{data.industry} · Owner: {data.owner} · {data.email}</div>
          </div>
          <AccountQuickActions accountId={id} onCreateFollowup={(aid) => navigate(`/followups/new?accountId=${aid}`)} onScheduleScan={() => {}} onAddNote={() => {}} />
        </div>
      }
      tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} variant="underline" />}
    >
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card style={{ background: '#131c2f', border: '1px solid #243049' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5' }}>Health Score</span>}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 0' }}>
              <HealthGauge score={data.healthScore} size={100} />
              <div>
                <div style={{ fontSize: 13, color: '#8b9bb5' }}>Last scan: {data.lastScanDate || 'Never'}</div>
                <div style={{ fontSize: 13, color: '#8b9bb5', marginTop: 4 }}>Open tickets: {data.openTickets}</div>
                <div style={{ fontSize: 13, color: '#8b9bb5', marginTop: 4 }}>Total revenue: ${data.totalRevenue.toLocaleString()}</div>
              </div>
            </div>
          </Card>
          <Card style={{ background: '#131c2f', border: '1px solid #243049' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5' }}>Account Info</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <span style={{ color: '#8b9bb5' }}>Phone</span><span style={{ color: '#e6ecf5' }}>{data.phone}</span>
              <span style={{ color: '#8b9bb5' }}>Website</span><span style={{ color: '#e6ecf5' }}>{data.website || '—'}</span>
              <span style={{ color: '#8b9bb5' }}>Address</span><span style={{ color: '#e6ecf5' }}>{data.address || '—'}</span>
              <span style={{ color: '#8b9bb5' }}>Created</span><span style={{ color: '#e6ecf5' }}>{data.createdAt}</span>
              <span style={{ color: '#8b9bb5' }}>Tags</span><span style={{ color: '#e6ecf5' }}>{data.tags.join(', ') || '—'}</span>
            </div>
          </Card>
          <Card style={{ background: '#131c2f', border: '1px solid #243049', gridColumn: '1 / -1' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5' }}>Contacts ({data.contacts.length})</span>}>
            {data.contacts.length === 0 ? <div style={{ padding: 12, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>No contacts</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.contacts.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #243049', fontSize: 13 }}>
                    <div><span style={{ color: '#e6ecf5', fontWeight: 500 }}>{c.name}</span>{c.isPrimary && <span style={{ color: '#41d1c4', marginLeft: 6, fontSize: 11 }}>Primary</span>}</div>
                    <div style={{ color: '#8b9bb5' }}>{c.role} · {c.email}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card style={{ background: '#131c2f', border: '1px solid #243049', gridColumn: '1 / -1' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5' }}>Recent Activity</span>}>
            <AccountTimeline entries={data.recentActivity} />
          </Card>
        </div>
      )}
      {activeTab !== 'overview' && (
        <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content will be available once the data source is connected.
        </div>
      )}
    </DetailLayout>
  );
}

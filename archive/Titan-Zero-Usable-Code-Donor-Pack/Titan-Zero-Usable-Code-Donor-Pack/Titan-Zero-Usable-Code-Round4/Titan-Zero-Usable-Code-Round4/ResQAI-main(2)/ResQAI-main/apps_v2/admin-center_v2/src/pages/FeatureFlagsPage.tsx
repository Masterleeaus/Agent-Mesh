import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { Card, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { FeatureFlagToggle } from '../components/FeatureFlagToggle';
import type { FeatureFlagDTO } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 };

const mockFlags: FeatureFlagDTO[] = [
  { id: 'ff1', key: 'feature.ai.reply', label: 'AI Reply Suggestions', description: 'Enable AI-generated reply suggestions in Support Center', enabled: true, appScope: ['support-center'], updatedAt: '2026-06-28T00:00:00Z' },
  { id: 'ff2', key: 'feature.kanban.view', label: 'Kanban View', description: 'Enable Kanban board view for ticket queues', enabled: true, appScope: ['support-center'], updatedAt: '2026-06-27T00:00:00Z' },
  { id: 'ff3', key: 'feature.bulk.actions', label: 'Bulk Actions', description: 'Enable bulk ticket operations (assign, escalate, close)', enabled: true, appScope: ['support-center'], updatedAt: '2026-06-26T00:00:00Z' },
  { id: 'ff4', key: 'feature.advanced.analytics', label: 'Advanced Analytics', description: 'Enable advanced analytics dashboards and exports', enabled: false, appScope: ['analytics-center'], updatedAt: '2026-06-20T00:00:00Z' },
  { id: 'ff5', key: 'feature.customer.portal', label: 'Customer Portal SSO', description: 'Enable SSO for Customer Portal', enabled: false, appScope: ['customer-portal'], updatedAt: '2026-06-15T00:00:00Z' },
  { id: 'ff6', key: 'feature.maintenance.mode', label: 'Maintenance Mode', description: 'Put the platform in maintenance mode', enabled: false, appScope: ['admin-center', 'support-center', 'customer-portal'], updatedAt: '2026-06-10T00:00:00Z' },
];

export function FeatureFlagsPage() {
  const [flags, setFlags] = useState(mockFlags);

  const handleToggle = (key: string, enabled: boolean) => {
    setFlags(flags.map(f => f.key === key ? { ...f, enabled } : f));
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Feature Flags</span>
      </div>
      <Card style={cardStyle}>
        {flags.length === 0 ? (
          <EmptyState title="No feature flags" description="No feature flags have been configured." />
        ) : (
          flags.map(f => <FeatureFlagToggle key={f.id} flag={f} onToggle={handleToggle} />)
        )}
      </Card>
    </div>
  );
}

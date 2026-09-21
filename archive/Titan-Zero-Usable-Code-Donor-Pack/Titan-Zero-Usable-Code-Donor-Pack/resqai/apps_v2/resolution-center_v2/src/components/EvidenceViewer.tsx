import { type FC } from 'react';
import { Card, Skeleton, EmptyState, StatusBadge } from '@resqai/foundation';
import type { EvidenceListItemVM } from '../models/view-models';

interface EvidenceViewerProps {
  evidence: EvidenceListItemVM[];
  loading: boolean;
}

export const EvidenceViewer: FC<EvidenceViewerProps> = ({ evidence, loading }) => {
  if (loading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (!evidence || evidence.length === 0) {
    return <EmptyState title="No evidence" description="No evidence has been uploaded for this case." size="sm" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {evidence.map(ev => (
        <Card key={ev.id} variant="bordered" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{ev.title}</span>
                <StatusBadge variant="info" style={{ fontSize: 10 }}>{ev.type}</StatusBadge>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#8b9bb5' }}>Uploaded by {ev.uploadedByName}</p>
            </div>
            <span style={{ fontSize: 11, color: '#6b7b95' }}>{new Date(ev.createdAt).toLocaleDateString()}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

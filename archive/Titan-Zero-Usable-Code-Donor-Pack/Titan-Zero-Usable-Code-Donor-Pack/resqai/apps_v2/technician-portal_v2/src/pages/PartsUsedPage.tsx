import { type FC } from 'react';
import { Card, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';

interface PartsUsedPageProps { jobId: string; }

export const PartsUsedPage: FC<PartsUsedPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load parts" message={error} onRetry={refetch} /></div>;
  if (!detail) return null;

  const { parts } = detail;
  const totalCost = parts.reduce((sum, p) => sum + p.totalPrice, 0);

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Parts Used</h1>
        <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}/inventory`; }}>
          Request Parts
        </Button>
      </div>

      {parts.length === 0 ? (
        <EmptyState title="No parts used" description="No parts have been recorded for this job. Use 'Request Parts' if you need inventory." />
      ) : (
        <div>
          <Card variant="bordered" style={{ marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#8b9bb5', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1a2744' }}>Part</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #1a2744' }}>SKU</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid #1a2744' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid #1a2744' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {parts.map(part => (
                  <tr key={part.id} style={{ color: '#e6ecf5' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a2744' }}>
                      <span>{part.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: '#5a6a85' }}>{part.category}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a2744', color: '#8b9bb5' }}>{part.sku}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a2744', textAlign: 'center' }}>{part.quantity}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #1a2744', textAlign: 'right' }}>${part.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ color: '#e6ecf5', fontWeight: 600 }}>
                  <td colSpan={3} style={{ padding: '12px', textAlign: 'right' }}>Total</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#41d1c4' }}>${totalCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
};

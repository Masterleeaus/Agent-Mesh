import { useState, type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';
import { technicianService } from '../services/technician-service';
import { useAppContext } from '../state/AppContext';

interface InventoryRequestPageProps { jobId: string; }

export const InventoryRequestPage: FC<InventoryRequestPageProps> = ({ jobId }) => {
  const { detail, loading, error } = useJobDetail(jobId);
  const { addNotification } = useAppContext();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !sku.trim() || quantity < 1) return;
    setSubmitting(true);
    try {
      await technicianService.requestParts(jobId, {
        name: name.trim(),
        sku: sku.trim(),
        quantity,
        urgency: 'normal',
      });
      addNotification({ type: 'success', title: 'Parts requested', message: 'Inventory request has been submitted.' });
      setName('');
      setSku('');
      setQuantity(1);
    } catch {
      addNotification({ type: 'error', title: 'Request failed', message: 'Could not submit inventory request.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load" message={error} /></div>;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Request Parts / Inventory</h1>

      <Card variant="bordered">
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Part Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Air Filter 20x20"
            style={{
              width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            aria-label="Part name"
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>SKU *</label>
          <input
            type="text"
            value={sku}
            onChange={e => setSku(e.target.value)}
            placeholder="e.g. AF-2020-MERV8"
            style={{
              width: '100%', padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            aria-label="SKU"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: '#8b9bb5', display: 'block', marginBottom: 4 }}>Quantity *</label>
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            style={{
              width: 100, padding: '8px 12px', background: '#131c2f', color: '#e6ecf5',
              border: '1px solid #243049', borderRadius: 6, fontSize: 13,
              fontFamily: 'inherit',
            }}
            aria-label="Quantity"
          />
        </div>
        <Button onClick={handleSubmit} disabled={!name.trim() || !sku.trim() || submitting} loading={submitting}>
          Submit Request
        </Button>
      </Card>
    </div>
  );
};

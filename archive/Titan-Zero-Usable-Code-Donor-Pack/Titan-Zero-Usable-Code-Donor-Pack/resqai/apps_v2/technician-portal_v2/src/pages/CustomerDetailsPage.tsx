import { type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';

interface CustomerDetailsPageProps { jobId: string; }

export const CustomerDetailsPage: FC<CustomerDetailsPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load customer" message={error} onRetry={refetch} /></div>;
  if (!detail) return null;

  const { customer, job } = detail;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Customer Details</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e6ecf5', margin: '0 0 16px' }}>{customer.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Phone</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>
              <a href={`tel:${customer.phone}`} style={{ color: '#41d1c4', textDecoration: 'none' }}>{customer.phone}</a>
            </p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Email</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>
              <a href={`mailto:${customer.email}`} style={{ color: '#41d1c4', textDecoration: 'none' }}>{customer.email}</a>
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Address</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{customer.address}, {customer.city}, {customer.state} {customer.zip}</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Preferred Contact</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{customer.preferredContact}</p>
          </div>
          {customer.accountName && (
            <div>
              <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Account</span>
              <p style={{ margin: '4px 0', color: '#e6ecf5' }}>{customer.accountName}</p>
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={() => { window.open(`tel:${customer.phone}`, '_self'); }}>
          Call {customer.name}
        </Button>
        <Button variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}/navigation`; }}>
          Navigate to Address
        </Button>
      </div>

      {job.completionNotes && (
        <Card variant="bordered" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 8px' }}>Previous Job Notes</h3>
          <p style={{ fontSize: 13, color: '#8b9bb5', margin: 0 }}>{job.completionNotes}</p>
        </Card>
      )}
    </div>
  );
};

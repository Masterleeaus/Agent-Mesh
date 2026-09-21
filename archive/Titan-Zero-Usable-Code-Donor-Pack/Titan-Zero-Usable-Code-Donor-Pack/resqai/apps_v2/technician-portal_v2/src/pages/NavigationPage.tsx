import { type FC } from 'react';
import { Card, Button, Skeleton, ErrorState } from '@resqai/foundation';
import { useJobDetail } from '../hooks/useJobDetail';

interface NavigationPageProps { jobId: string; }

export const NavigationPage: FC<NavigationPageProps> = ({ jobId }) => {
  const { detail, loading, error, refetch } = useJobDetail(jobId);

  if (loading) return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={300} /></div>;
  if (error) return <div style={{ padding: 24 }}><ErrorState title="Failed to load navigation" message={error} onRetry={refetch} /></div>;
  if (!detail) return null;

  const { job, customer } = detail;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customer.address + ', ' + customer.city + ', ' + customer.state)}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(customer.address + ', ' + customer.city + ', ' + customer.state)}`;

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Button size="sm" variant="ghost" onClick={() => { window.location.hash = `#/jobs/${jobId}`; }} style={{ marginBottom: 12 }}>
        &larr; Back to Job
      </Button>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Navigation &amp; Directions</h1>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Destination</h2>
        <p style={{ fontSize: 14, color: '#e6ecf5', margin: '0 0 4px' }}>{customer.name}</p>
        <p style={{ fontSize: 13, color: '#8b9bb5', margin: '0 0 16px' }}>{customer.address}, {customer.city}, {customer.state} {customer.zip}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Button variant="primary" onClick={() => { window.open(mapsUrl, '_blank'); }}>
            Open in Google Maps
          </Button>
          <Button variant="ghost" onClick={() => { window.open(wazeUrl, '_blank'); }}>
            Open in Waze
          </Button>
          <Button variant="ghost" onClick={() => { window.open(`tel:${customer.phone}`, '_self'); }}>
            Call Customer
          </Button>
        </div>
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', margin: '0 0 12px' }}>Travel Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Distance</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5', fontSize: 18, fontWeight: 600 }}>{job.travelDistance || '--'} mi</p>
          </div>
          <div>
            <span style={{ fontSize: 11, color: '#8b9bb5', textTransform: 'uppercase' }}>Est. Travel Time</span>
            <p style={{ margin: '4px 0', color: '#e6ecf5', fontSize: 18, fontWeight: 600 }}>{job.travelDuration || '--'} min</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

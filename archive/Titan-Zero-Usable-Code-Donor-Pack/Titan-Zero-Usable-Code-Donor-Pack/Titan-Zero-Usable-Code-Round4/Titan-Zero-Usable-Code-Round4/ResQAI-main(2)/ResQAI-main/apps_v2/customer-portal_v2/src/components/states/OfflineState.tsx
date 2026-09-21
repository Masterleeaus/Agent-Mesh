import { Card, Button } from '../../../../shared/src/components';

interface OfflineStateProps {
  onRetry?: () => void;
  compact?: boolean;
}

export function OfflineState({ onRetry, compact }: OfflineStateProps) {
  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(231,76,60,0.1)', borderRadius: 8, border: '1px solid #e74c3c' }}>
        <span style={{ fontSize: 16 }}>📡</span>
        <span style={{ fontSize: 12, color: '#e6ecf5' }}>You are offline. Some features may be unavailable.</span>
        {onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>}
      </div>
    );
  }

  return (
    <Card padding="lg" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
      <h2 style={{ color: '#e6ecf5', fontSize: 20, margin: '0 0 8px' }}>No Internet Connection</h2>
      <p style={{ color: '#8b9bb5', fontSize: 13, margin: '0 0 20px' }}>Please check your connection and try again.</p>
      {onRetry && <Button variant="primary" onClick={onRetry}>Retry</Button>}
    </Card>
  );
}
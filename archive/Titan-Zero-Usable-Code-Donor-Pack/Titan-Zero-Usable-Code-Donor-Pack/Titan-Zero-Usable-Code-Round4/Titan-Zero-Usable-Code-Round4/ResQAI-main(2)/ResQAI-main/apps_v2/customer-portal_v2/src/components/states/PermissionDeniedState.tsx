import { Card, Button } from '../../../../shared/src/components';

interface PermissionDeniedStateProps {
  title?: string;
  message?: string;
  onContactSupport?: () => void;
}

export function PermissionDeniedState({ title = 'Access Denied', message = 'You do not have permission to access this page.', onContactSupport }: PermissionDeniedStateProps) {
  return (
    <Card padding="lg" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ color: '#e6ecf5', fontSize: 20, margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: '#8b9bb5', fontSize: 13, margin: '0 0 20px' }}>{message}</p>
      {onContactSupport && <Button variant="primary" onClick={onContactSupport}>Contact Support</Button>}
    </Card>
  );
}
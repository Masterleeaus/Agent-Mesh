import { Card, Button } from '../../../../shared/src/components';

interface NoServiceHistoryStateProps {
  onBookAppointment?: () => void;
}

export function NoServiceHistoryState({ onBookAppointment }: NoServiceHistoryStateProps) {
  return (
    <Card padding="lg" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
      <h2 style={{ color: '#e6ecf5', fontSize: 18, margin: '0 0 8px' }}>No Service History</h2>
      <p style={{ color: '#8b9bb5', fontSize: 13, margin: '0 0 20px' }}>We don't have any past service records for your account. Schedule your first appointment to get started.</p>
      {onBookAppointment && <Button variant="primary" onClick={onBookAppointment}>Book an Appointment</Button>}
    </Card>
  );
}
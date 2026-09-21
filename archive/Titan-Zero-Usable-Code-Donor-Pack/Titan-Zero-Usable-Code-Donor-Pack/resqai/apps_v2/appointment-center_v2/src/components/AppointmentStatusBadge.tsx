import { StatusBadge } from '../../../shared/src/components';

interface AppointmentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  scheduled: 'info',
  confirmed: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
  no_show: 'error',
  rescheduled: 'warning',
};

export function AppointmentStatusBadge({ status, size }: AppointmentStatusBadgeProps) {
  return (
    <StatusBadge variant={statusVariantMap[status] || 'neutral'} size={size}>
      {status.replace(/_/g, ' ')}
    </StatusBadge>
  );
}

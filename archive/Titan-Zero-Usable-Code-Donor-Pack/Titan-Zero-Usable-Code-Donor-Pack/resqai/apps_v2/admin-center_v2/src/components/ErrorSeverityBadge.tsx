import { type FC } from 'react';
import { StatusBadge } from '@resqai/foundation';

export const ErrorSeverityBadge: FC<{ severity: string }> = ({ severity }) => {
  const variant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { critical: 'error', high: 'warning', medium: 'neutral', low: 'success' };
  return <StatusBadge variant={variant[severity] || 'neutral'} size="sm">{severity}</StatusBadge>;
};

export const ErrorStatusBadge: FC<{ status: string }> = ({ status }) => {
  const variant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { open: 'error', resolved: 'success', ignored: 'neutral' };
  return <StatusBadge variant={variant[status] || 'neutral'} size="sm">{status}</StatusBadge>;
};

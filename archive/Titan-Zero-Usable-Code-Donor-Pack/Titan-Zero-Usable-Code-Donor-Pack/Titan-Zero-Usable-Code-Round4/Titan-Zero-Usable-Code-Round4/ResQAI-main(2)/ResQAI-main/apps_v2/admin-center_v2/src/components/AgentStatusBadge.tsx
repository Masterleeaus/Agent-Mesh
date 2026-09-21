import { type FC } from 'react';
import { StatusBadge } from '@resqai/foundation';
import type { AgentStatus } from '../models';

const variant: Record<AgentStatus, 'success' | 'warning' | 'error' | 'neutral'> = { online: 'success', busy: 'warning', offline: 'neutral', error: 'error' };

export const AgentStatusBadge: FC<{ status: AgentStatus }> = ({ status }) => <StatusBadge variant={variant[status]} size="sm">{status}</StatusBadge>;

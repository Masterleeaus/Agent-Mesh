import { type FC } from 'react';
import { StatusBadge } from '@resqai/foundation';
import type { WorkflowStatus, WorkflowRunStatus } from '../models';

const wfVariant: Record<WorkflowStatus, 'success' | 'warning' | 'error' | 'neutral'> = { active: 'success', paused: 'warning', failed: 'error', draft: 'neutral' };
const runVariant: Record<WorkflowRunStatus, 'success' | 'warning' | 'error' | 'neutral'> = { running: 'warning', completed: 'success', failed: 'error', cancelled: 'neutral' };

export const WorkflowStatusBadge: FC<{ status: WorkflowStatus }> = ({ status }) => <StatusBadge variant={wfVariant[status]} size="sm">{status}</StatusBadge>;
export const WorkflowRunStatusBadge: FC<{ status: WorkflowRunStatus }> = ({ status }) => <StatusBadge variant={runVariant[status]} size="sm">{status}</StatusBadge>;

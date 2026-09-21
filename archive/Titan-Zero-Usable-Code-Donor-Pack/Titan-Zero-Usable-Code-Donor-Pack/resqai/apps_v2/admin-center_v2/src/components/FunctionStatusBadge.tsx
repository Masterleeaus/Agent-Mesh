import { type FC } from 'react';
import { StatusBadge } from '@resqai/foundation';
import type { FunctionStatus, FunctionRunStatus } from '../models';

const fnVariant: Record<FunctionStatus, 'success' | 'error' | 'neutral'> = { active: 'success', inactive: 'neutral', error: 'error' };
const runVariant: Record<FunctionRunStatus, 'success' | 'warning' | 'error' | 'neutral'> = { running: 'warning', completed: 'success', failed: 'error', timed_out: 'error' };

export const FunctionStatusBadge: FC<{ status: FunctionStatus }> = ({ status }) => <StatusBadge variant={fnVariant[status]} size="sm">{status}</StatusBadge>;
export const FunctionRunStatusBadge: FC<{ status: FunctionRunStatus }> = ({ status }) => <StatusBadge variant={runVariant[status]} size="sm">{status}</StatusBadge>;

import { useState, useEffect, useCallback } from 'react';
import type { TaskDTO } from '../models';

const MOCK_TASKS: TaskDTO[] = [
  { id: 'task-1', accountId: 'acc-1', title: 'Prepare Q3 proposal', description: 'Draft and send Q3 service proposal to Acme Corp', priority: 'high', status: 'in_progress', dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), assigneeId: 'u-1', assigneeName: 'Sarah Connor', relatedEntityType: 'opportunity', relatedEntityId: 'opp-1', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'task-2', accountId: 'acc-2', title: 'Renewal contract review', description: 'Review renewal terms with legal before sending to client', priority: 'critical', status: 'open', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), assigneeId: 'u-2', assigneeName: 'Mike Peters', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'task-3', accountId: 'acc-3', title: 'Escalation follow-up', description: 'Follow up on unresolved support ticket #TKT-010', priority: 'high', status: 'open', dueDate: new Date(Date.now() + 1 * 86400000).toISOString(), assigneeId: 'u-3', assigneeName: 'Lisa Wong', relatedEntityType: 'ticket', relatedEntityId: 'tkt-010', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'task-4', accountId: 'acc-4', title: 'Damage assessment report', description: 'Compile damage assessment for insurance claim', priority: 'medium', status: 'completed', dueDate: new Date(Date.now() - 1 * 86400000).toISOString(), completedDate: new Date(Date.now() - 2 * 86400000).toISOString(), assigneeId: 'u-1', assigneeName: 'Sarah Connor', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'task-5', accountId: 'acc-5', title: 'Customer satisfaction call', description: 'Call Eve Martinez to check satisfaction after recent service', priority: 'low', status: 'open', dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), assigneeId: 'u-2', assigneeName: 'Mike Peters', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
];

export function useTasks() {
  const [data, setData] = useState<TaskDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setData(MOCK_TASKS);
      setTotal(MOCK_TASKS.length);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, total, loading, error, refetch: fetch };
}

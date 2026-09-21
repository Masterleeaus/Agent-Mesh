import {
  listRecords,
  runAgent,
  waitForAgentResponse,
  logOperation,
} from '../../../../packages/sdk/lemma-sdk';
import { parseAgentResponse } from '../../../../packages/utils/service-helpers';
import type {
  Ticket,
  Appointment,
  Dispute,
  Task,
  OperationsLogEntry,
  DashboardData,
  CoordinatorResponse,
} from '../types';

export async function fetchDashboardData(): Promise<DashboardData> {
  const [tickets, appointments, disputes, tasks] = await Promise.all([
    listRecords<Ticket>('tickets', 500),
    listRecords<Appointment>('appointments', 500),
    listRecords<Dispute>('disputes', 500),
    listRecords<Task>('tasks', 500),
  ]);
  return { tickets, appointments, disputes, tasks };
}

export async function runCoordinator(): Promise<CoordinatorResponse> {
  const payload = JSON.stringify({
    scope: 'daily',
    today: new Date().toISOString().split('T')[0],
    max_actions: 8,
    create_tasks: true,
  });

  const conv = await runAgent('operations-coordinator', payload, 'Daily standup coordination');
  const text = await waitForAgentResponse(conv.id);
  const parsed = parseAgentResponse<CoordinatorResponse>(text);

  await logOperation(
    'run_coordinator',
    `Generated ${parsed.recommendations?.length ?? 0} recommendations (status: ${parsed.coordination_status})`,
    'agent:operations-coordinator'
  );

  const discordNotified = parsed.connector_actions?.some(
    (a: { connector: string }) => a.connector === 'discord'
  );

  await logOperation(
    'discord_notification',
    `Discord notification ${discordNotified ? 'sent' : 'skipped'} for coordinator run (status: ${parsed.coordination_status})`,
    'agent:operations-coordinator'
  );

  return parsed;
}

export async function fetchOperationsLog(): Promise<OperationsLogEntry[]> {
  const entries = await listRecords<OperationsLogEntry>('operations_log', 50);
  return entries
    .sort((a: OperationsLogEntry, b: OperationsLogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}

import { LemmaClient } from 'lemma-sdk';
import type {
  Account, Appointment, Customer, Dispute, Followup, OperationsLogEntry,
  Task, Technician, Ticket, AgentConversation, AgentMessage,
  AccountHealthScanResult, FlagSlippingFollowupsResult,
} from '../types';
import { environment } from '../config/environment';

let client: LemmaClient | null = null;
let initPromise: Promise<LemmaClient> | null = null;

export function setClient(c: LemmaClient): void {
  client = c;
}

export function getClient(): LemmaClient {
  if (!client) throw new Error('Lemma SDK not initialized. Call initLemmaClient() first.');
  return client;
}

export async function initLemmaClient(): Promise<LemmaClient> {
  if (client) return client;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const c = new LemmaClient({
      podId: environment.podId,
      apiUrl: environment.apiUrl,
      authUrl: environment.authUrl,
    });
    await c.initialize();
    client = c;
    return c;
  })();
  return initPromise;
}

export async function listRecords<T>(table: string, limit = 200): Promise<T[]> {
  await initLemmaClient();
  const res = await client!.records.list(table, { limit });
  return (res.items || []) as T[];
}

export async function getRecord<T>(table: string, id: string): Promise<T> {
  await initLemmaClient();
  return (await client!.records.get(table, id)) as T;
}

export async function createRecord(table: string, data: Record<string, unknown>): Promise<string> {
  await initLemmaClient();
  const res = await client!.records.create(table, data);
  return res.id;
}

export async function updateRecord(table: string, id: string, data: Record<string, unknown>): Promise<void> {
  await initLemmaClient();
  await client!.records.update(table, id, data);
}

export async function bulkUpdateRecords(table: string, items: Record<string, unknown>[]): Promise<void> {
  await initLemmaClient();
  await client!.records.bulk.update(table, items);
}

export async function runAgent(agentName: string, prompt: string, title?: string): Promise<AgentConversation> {
  await initLemmaClient();
  const res = await client!.agents.run(agentName, prompt, title ? { title } : undefined);
  return res as unknown as AgentConversation;
}

export async function waitForAgentResponse(convId: string, timeoutMs = 135000): Promise<string> {
  await initLemmaClient();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await client!.conversations.messages.list(convId);
    const msgs = res.items || [];
    const final = [...msgs].reverse().find(
      (m) => m.role === 'assistant' && m.metadata?.is_final_answer && m.text
    );
    if (final?.text) return final.text;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Agent timed out');
}

export async function runFunction<T>(fnName: string, params: Record<string, unknown>): Promise<T> {
  await initLemmaClient();
  const res = await client!.functions.run(fnName, { input: params });
  const raw = res?.output_data ?? res;
  if (typeof raw === 'string') return JSON.parse(raw) as T;
  return raw as T;
}

export async function logOperation(action: string, result: string, actor = 'human'): Promise<void> {
  await initLemmaClient();
  await client!.records.create('operations_log', {
    action,
    result,
    timestamp: new Date().toISOString(),
    actor,
  });
}

export async function runConnectorOperation(authConfig: string, operation: string, payload: Record<string, unknown>): Promise<unknown> {
  await initLemmaClient();
  const res = await (client!.connectors as unknown as { execute: (auth: string, op: string, payload: Record<string, unknown>) => Promise<unknown> }).execute(authConfig, operation, payload);
  return res;
}

export { LemmaClient };

import type {
  Account, Appointment, Customer, Dispute, Followup, OperationsLogEntry,
  Task, Technician, Ticket, AgentConversation, AgentMessage,
  AccountHealthScanResult, FlagSlippingFollowupsResult,
} from './types';

declare global {
  interface window {
    LemmaClient?: {
      LemmaClient: new () => LemmaClientInstance;
    };
    __LEMMA_CONFIG__?: {
      podId: string;
      apiUrl: string;
      authUrl: string;
    };
  }
}

interface LemmaClientInstance {
  initialize(): Promise<{ status: string; user?: { name?: string; email?: string } }>;
  auth: { redirectToAuth(): void };
  records: {
    list(table: string, opts?: { limit?: number; filters?: unknown[]; sort?: unknown[] }): Promise<{ items?: unknown[] }>;
    get(table: string, id: string): Promise<unknown>;
    create(table: string, data: Record<string, unknown>): Promise<{ id: string }>;
    update(table: string, id: string, data: Record<string, unknown>): Promise<unknown>;
    bulkUpdate(table: string, items: Record<string, unknown>[]): Promise<unknown>;
  };
  agents: {
    run(agentName: string, prompt: string, opts?: { title?: string }): Promise<AgentConversation>;
  };
  conversations: {
    messages: {
      list(conversationId: string): Promise<{ items?: AgentMessage[] }>;
    };
  };
  functions: {
    run(fnName: string, params: Record<string, unknown>): Promise<{ output_data?: unknown; output?: unknown }>;
  };
}

let client: LemmaClientInstance | null = null;

export function getClient(): LemmaClientInstance {
  if (!client) throw new Error('Lemma SDK not initialized. Call initLemmaClient() first.');
  return client;
}

export async function initLemmaClient(): Promise<LemmaClientInstance> {
  if (client) return client;
  try {
    const LemmaClient = window.LemmaClient?.LemmaClient;
    if (!LemmaClient) throw new Error('LemmaClient SDK not loaded');
    const c = new LemmaClient();
    const state = await c.initialize();
    if (state.status !== 'authenticated') {
      c.auth.redirectToAuth();
      throw new Error('Redirecting to auth');
    }
    client = c;
    return c;
  } catch (e) {
    throw e;
  }
}

export async function listRecords<T>(table: string, limit = 200): Promise<T[]> {
  const c = getClient();
  const res = await c.records.list(table, { limit });
  return (res.items || []) as T[];
}

export async function getRecord<T>(table: string, id: string): Promise<T> {
  const c = getClient();
  return (await c.records.get(table, id)) as T;
}

export async function createRecord(table: string, data: Record<string, unknown>): Promise<string> {
  const c = getClient();
  const res = await c.records.create(table, data);
  return res.id;
}

export async function updateRecord(table: string, id: string, data: Record<string, unknown>): Promise<void> {
  const c = getClient();
  await c.records.update(table, id, data);
}

export async function bulkUpdateRecords(table: string, items: Record<string, unknown>[]): Promise<void> {
  const c = getClient();
  await c.records.bulkUpdate(table, items);
}

export async function runAgent(agentName: string, prompt: string, title?: string): Promise<AgentConversation> {
  const c = getClient();
  return c.agents.run(agentName, prompt, title ? { title } : undefined);
}

export async function waitForAgentResponse(convId: string, timeoutMs = 135000): Promise<string> {
  const c = getClient();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await c.conversations.messages.list(convId);
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
  const c = getClient();
  const res = await c.functions.run(fnName, params);
  const raw = res?.output_data ?? res?.output ?? res;
  if (typeof raw === 'string') return JSON.parse(raw) as T;
  return raw as T;
}

export async function logOperation(action: string, result: string, actor = 'human'): Promise<void> {
  await createRecord('operations_log', {
    action,
    result,
    timestamp: new Date().toISOString(),
    actor,
  });
}

export { type LemmaClientInstance };

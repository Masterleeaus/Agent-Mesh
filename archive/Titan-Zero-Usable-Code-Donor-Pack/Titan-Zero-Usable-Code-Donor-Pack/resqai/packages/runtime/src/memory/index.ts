import type { RuntimeContext, RuntimeConfig, RuntimeMessage, MemoryEntry } from '../types';

const MEMORY_STORES = new Map<string, RuntimeContext['memory']>();

export function loadMemory(context: RuntimeContext): void {
  const storeKey = `${context.agentName}:${context.sessionId}`;
  const stored = MEMORY_STORES.get(storeKey);
  if (stored) {
    context.memory = stored;
  }
}

export function saveMemory(context: RuntimeContext): void {
  const storeKey = `${context.agentName}:${context.sessionId}`;
  MEMORY_STORES.set(storeKey, {
    shortTerm: [...context.memory.shortTerm],
    longTerm: [...context.memory.longTerm],
    summary: context.memory.summary,
  });

  if (context.config.memory.ttlMs && context.config.memory.ttlMs > 0) {
    setTimeout(() => {
      MEMORY_STORES.delete(storeKey);
    }, context.config.memory.ttlMs);
  }
}

export function appendShortTermMemory(context: RuntimeContext, message: RuntimeMessage): void {
  if (!context.config.memory.enabled) return;
  context.memory.shortTerm.push(message);

  if (context.memory.shortTerm.length > context.config.memory.maxMessages) {
    const toSummarize = context.memory.shortTerm.splice(
      0,
      context.memory.shortTerm.length - context.config.memory.summarizationThreshold,
    );
    const summary = toSummarize.map(m => `[${m.role}]: ${m.content.slice(0, 100)}`).join('\n');
    context.memory.longTerm.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: toSummarize.map(m => m.content).join('\n'),
      timestamp: new Date().toISOString(),
      summary,
    });
  }
}

export function appendToLongTermMemory(context: RuntimeContext, message: RuntimeMessage): void {
  if (!context.config.memory.enabled) return;

  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    role: message.role as 'user' | 'assistant',
    content: message.content,
    timestamp: message.timestamp,
    summary: message.content.slice(0, 200),
  };
  context.memory.longTerm.push(entry);
}

export function getRelevantMemories(context: RuntimeContext, query?: string, limit = 5): MemoryEntry[] {
  const entries = context.memory.longTerm;
  if (!query) {
    return entries.slice(-limit);
  }
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 3);

  const scored = entries.map(entry => {
    const contentLower = (entry.summary || entry.content).toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        score += term.length;
      }
    }
    return { entry, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

export function generateMemorySummary(context: RuntimeContext): string {
  if (context.memory.longTerm.length === 0) return '';
  const recent = context.memory.longTerm.slice(-10);
  const sections = recent.map(e => {
    const label = e.role === 'user' ? 'Customer' : 'Agent';
    return `${label}: ${e.summary || e.content.slice(0, 150)}`;
  });
  return sections.join('\n---\n');
}

export function clearMemoryContext(context: RuntimeContext): void {
  const sessionKey = context.sessionId;
  const storeKeys = [...MEMORY_STORES.keys()].filter(k => k.includes(sessionKey));
  for (const key of storeKeys) {
    MEMORY_STORES.delete(key);
  }
  context.memory = { shortTerm: [], longTerm: [] };
}

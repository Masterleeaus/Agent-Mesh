import type { RuntimeContext, RuntimeConfig, RuntimeMessage } from '../types';

export function createRuntimeContext(
  agentName: string,
  config: RuntimeConfig,
  input: unknown,
  schema: unknown,
): RuntimeContext {
  const sessionId = crypto.randomUUID();
  const traceId = crypto.randomUUID();
  const spanId = crypto.randomUUID();

  return {
    agentName,
    config,
    input,
    schema,
    sessionId,
    traceId,
    spanId,
    messages: [],
    memory: {
      shortTerm: [],
      longTerm: [],
    },
    startTime: Date.now(),
  };
}

export function buildMessages(
  instruction: string,
  input: unknown,
  context: RuntimeContext,
): RuntimeMessage[] {
  const messages: RuntimeMessage[] = [];
  const now = new Date().toISOString();

  messages.push({
    role: 'system',
    content: instruction,
    timestamp: now,
  });

  if (context.memory.summary) {
    messages.push({
      role: 'system',
      content: `## Prior context summary\n${context.memory.summary}`,
      timestamp: now,
    });
  }

  if (context.memory.longTerm.length > 0) {
    const recentMemories = context.memory.longTerm.slice(-5);
    const memoryBlock = recentMemories.map(m =>
      `[${m.role} @ ${m.timestamp}]: ${m.summary || m.content.slice(0, 200)}`
    ).join('\n');
    messages.push({
      role: 'system',
      content: `## Relevant history\n${memoryBlock}`,
      timestamp: now,
    });
  }

  const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
  messages.push({
    role: 'user',
    content: inputStr,
    timestamp: now,
  });

  return messages;
}

export function applyWindowStrategy(messages: RuntimeMessage[], config: RuntimeConfig): RuntimeMessage[] {
  if (messages.length <= 1) {
    return messages;
  }

  switch (config.context.windowStrategy) {
    case 'truncate':
      return truncateWindow(messages, config);
    case 'summary':
      return messages;
    case 'sliding':
      return slidingWindow(messages, config);
    case 'hybrid':
      return hybridWindow(messages, config);
    default:
      return messages;
  }
}

function truncateWindow(messages: RuntimeMessage[], config: RuntimeConfig): RuntimeMessage[] {
  const systemMsgs = messages.filter(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');
  const maxNonSystem = Math.max(1, Math.floor(config.context.maxTokens / 1000));
  const truncated = nonSystem.slice(-maxNonSystem);
  return [...systemMsgs, ...truncated];
}

function slidingWindow(messages: RuntimeMessage[], config: RuntimeConfig): RuntimeMessage[] {
  const systemMsgs = messages.filter(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');
  const maxMessages = Math.max(2, Math.floor(config.context.maxTokens / 2000));
  const windowed = nonSystem.slice(-maxMessages);
  return [...systemMsgs, ...windowed];
}

function hybridWindow(messages: RuntimeMessage[], config: RuntimeConfig): RuntimeMessage[] {
  const systemMsgs = messages.filter(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');
  const maxMessages = Math.max(2, Math.floor(config.context.maxTokens / 1500));
  const recentCount = Math.min(nonSystem.length, maxMessages);
  const windowed = nonSystem.slice(-recentCount);
  return [...systemMsgs, ...windowed];
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export function totalContextTokens(messages: RuntimeMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateTokenCount(m.content), 0);
}

export async function compressContext(
  messages: RuntimeMessage[],
  config: RuntimeConfig,
): Promise<RuntimeMessage[]> {
  if (!config.context.compressionEnabled) {
    return messages;
  }

  const totalTokens = totalContextTokens(messages);
  if (totalTokens <= config.context.maxTokens) {
    return messages;
  }

  const systemMsgs = messages.filter(m => m.role === 'system');
  const nonSystem = messages.filter(m => m.role !== 'system');

  while (totalContextTokens([...systemMsgs, ...nonSystem]) > config.context.maxTokens && nonSystem.length > 1) {
    nonSystem.splice(0, Math.ceil(nonSystem.length * 0.2));
  }

  return [...systemMsgs, ...nonSystem];
}

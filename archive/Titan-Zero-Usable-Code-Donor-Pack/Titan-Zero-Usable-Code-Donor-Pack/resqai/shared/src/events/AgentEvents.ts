import { EventBus } from './EventBus';

export interface AgentEventMap {
  'agent:started': { agentId: string; agentName: string; input: unknown };
  'agent:message': { agentId: string; content: string; role: 'user' | 'assistant' };
  'agent:completed': { agentId: string; agentName: string; result: unknown; duration: number };
  'agent:failed': { agentId: string; agentName: string; error: string };
  'agent:requiresAction': { agentId: string; actionType: string; context: unknown };
}

export type AgentEvent = keyof AgentEventMap;

export const agentEvents = new EventBus();

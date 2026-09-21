import { EventBus } from './EventBus';

export interface WorkflowEventMap {
  'workflow:started': { workflowId: string; name: string; initiatedBy: string };
  'workflow:stepCompleted': { workflowId: string; step: string; result: unknown };
  'workflow:completed': { workflowId: string; duration: number; result: unknown };
  'workflow:failed': { workflowId: string; step: string; error: string };
  'workflow:paused': { workflowId: string };
  'workflow:resumed': { workflowId: string };
  'workflow:cancelled': { workflowId: string };
}

export type WorkflowEvent = keyof WorkflowEventMap;

export const workflowEvents = new EventBus();

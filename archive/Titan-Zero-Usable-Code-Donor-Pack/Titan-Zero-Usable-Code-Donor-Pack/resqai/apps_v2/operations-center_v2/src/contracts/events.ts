import type { OperationDTO, TechnicianDTO } from '../models/dto';

export const OPERATIONS_CENTER_EVENTS = {
  OPERATION_CREATED: 'operation.created',
  OPERATION_DISPATCHED: 'operation.dispatched',
  OPERATION_ASSIGNED: 'operation.assigned',
  OPERATION_REASSIGNED: 'operation.reassigned',
  OPERATION_STATUS_CHANGED: 'operation.status.changed',
  OPERATION_ESCALATED: 'operation.escalated',
  OPERATION_CLOSED: 'operation.closed',
  TECHNICIAN_STATUS_CHANGED: 'technician.status.changed',
  CONFLICT_DETECTED: 'operation.conflict.detected',
} as const;

export type OperationsCenterEventName = typeof OPERATIONS_CENTER_EVENTS[keyof typeof OPERATIONS_CENTER_EVENTS];

export interface OperationCreatedPayload {
  operation: OperationDTO;
}

export interface OperationDispatchedPayload {
  operationId: string;
  technicianId: string;
  method: string;
}

export interface OperationAssignedPayload {
  operationId: string;
  technicianId: string;
  technicianName: string;
}

export interface OperationReassignedPayload {
  operationId: string;
  previousTechnicianId: string;
  newTechnicianId: string;
  reason: string;
}

export interface OperationStatusChangedPayload {
  operationId: string;
  previousStatus: string;
  newStatus: string;
}

export interface OperationEscalatedPayload {
  operationId: string;
  reason: string;
  escalatedTo?: string;
}

export interface OperationClosedPayload {
  operationId: string;
  resolution: string;
}

export interface TechnicianStatusChangedPayload {
  technicianId: string;
  previousStatus: string;
  newStatus: string;
}

export interface ConflictDetectedPayload {
  operationId: string;
  technicianId: string;
  conflictingOperationId: string;
  warning: string;
}

export type OperationsCenterEventPayload =
  | OperationCreatedPayload
  | OperationDispatchedPayload
  | OperationAssignedPayload
  | OperationReassignedPayload
  | OperationStatusChangedPayload
  | OperationEscalatedPayload
  | OperationClosedPayload
  | TechnicianStatusChangedPayload
  | ConflictDetectedPayload;

export type OperationsCenterEvent = {
  [K in OperationsCenterEventName]: { type: K; payload: Extract<OperationsCenterEventPayload, Record<string, unknown>> };
}[OperationsCenterEventName];

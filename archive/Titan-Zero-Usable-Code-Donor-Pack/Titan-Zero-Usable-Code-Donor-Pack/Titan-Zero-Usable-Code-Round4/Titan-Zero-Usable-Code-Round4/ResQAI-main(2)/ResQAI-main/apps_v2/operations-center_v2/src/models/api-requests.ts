import type { OperationPriority, OperationType, OperationStatus, TechnicianStatus, RegionName, DispatchMethod } from './dto';

export interface OperationsListFilters {
  status?: OperationStatus[];
  priority?: OperationPriority[];
  type?: OperationType[];
  region?: RegionName[];
  technicianId?: string;
  search?: string;
  isEscalated?: boolean;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface DispatchOperationRequest {
  operationId: string;
  technicianId: string;
  method: DispatchMethod;
  notes?: string;
}

export interface ReassignTechnicianRequest {
  operationId: string;
  currentTechnicianId: string;
  newTechnicianId: string;
  reason: string;
}

export interface EscalateOperationRequest {
  operationId: string;
  reason: string;
  escalateTo?: string;
}

export interface CloseOperationRequest {
  operationId: string;
  resolution: string;
  actualDuration?: number;
}

export interface UpdateOperationStatusRequest {
  operationId: string;
  status: OperationStatus;
  notes?: string;
}

export interface SearchOperationsRequest {
  query: string;
  filters?: OperationsListFilters;
  limit?: number;
}

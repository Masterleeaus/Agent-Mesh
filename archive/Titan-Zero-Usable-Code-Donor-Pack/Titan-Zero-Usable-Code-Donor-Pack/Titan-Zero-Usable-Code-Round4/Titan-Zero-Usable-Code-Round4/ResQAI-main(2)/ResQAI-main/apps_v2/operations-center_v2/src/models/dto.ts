export type OperationStatus = 'pending_dispatch' | 'dispatched' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'escalated';
export type OperationPriority = 'low' | 'normal' | 'high' | 'critical';
export type OperationType = 'installation' | 'repair' | 'maintenance' | 'inspection' | 'consultation' | 'delivery' | 'pickup' | 'emergency';
export type TechnicianStatus = 'available' | 'en_route' | 'on_site' | 'on_break' | 'offline' | 'completed';
export type DispatchMethod = 'auto' | 'manual' | 'scheduled';
export type RegionName = 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'national';

export interface OperationDTO {
  id: string;
  title: string;
  description: string;
  type: OperationType;
  priority: OperationPriority;
  status: OperationStatus;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  technicianId?: string;
  technicianName?: string;
  region: RegionName;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration: number;
  notes?: string;
  escalationReason?: string;
  escalatedTo?: string;
  conflictWarning?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TechnicianDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: TechnicianStatus;
  currentOperationId?: string;
  region: RegionName;
  skills: string[];
  rating: number;
  completedJobs: number;
  isOnline: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface DispatchDTO {
  id: string;
  operationId: string;
  technicianId: string;
  technicianName: string;
  method: DispatchMethod;
  dispatchedBy: string;
  dispatchedAt: string;
  estimatedArrival?: string;
  actualArrival?: string;
  status: 'pending' | 'accepted' | 'declined' | 'en_route' | 'completed';
  notes?: string;
}

export interface RegionDTO {
  id: RegionName;
  name: string;
  activeTechnicians: number;
  pendingOperations: number;
  inProgressOperations: number;
  completedToday: number;
  color: string;
}

export interface EscalationDTO {
  id: string;
  operationId: string;
  operationTitle: string;
  reason: string;
  escalatedBy: string;
  escalatedTo?: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  priority: OperationPriority;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface TimelineEventDTO {
  id: string;
  operationId: string;
  type: 'dispatch' | 'assignment' | 'status_change' | 'note' | 'escalation' | 'completion' | 'conflict';
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

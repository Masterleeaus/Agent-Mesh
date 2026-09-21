import type { OperationDTO, TechnicianDTO, DispatchDTO, TimelineEventDTO, EscalationDTO, RegionDTO, OperationStatus, OperationPriority, OperationType, TechnicianStatus, DispatchMethod, RegionName } from './dto';

export interface DispatchQueueItemVM {
  id: string;
  title: string;
  priority: OperationPriority;
  type: OperationType;
  customerName: string;
  customerAddress: string;
  region: RegionName;
  estimatedDuration: number;
  age: number;
  isEscalated: boolean;
}

export interface AssignmentQueueItemVM {
  id: string;
  title: string;
  priority: OperationPriority;
  type: OperationType;
  customerName: string;
  customerAddress: string;
  region: RegionName;
  technicianName?: string;
  scheduledStart?: string;
  status: OperationStatus;
}

export interface TechnicianStatusItemVM {
  id: string;
  name: string;
  status: TechnicianStatus;
  region: RegionName;
  currentOperationTitle?: string;
  completedJobs: number;
  rating: number;
  isOnline: boolean;
}

export interface OperationsTimelineItemVM {
  id: string;
  operationId: string;
  type: TimelineEventDTO['type'];
  description: string;
  actorName: string;
  createdAt: string;
}

export interface EscalationListItemVM {
  id: string;
  operationId: string;
  operationTitle: string;
  reason: string;
  escalatedBy: string;
  priority: OperationPriority;
  status: EscalationDTO['status'];
  createdAt: string;
}

export interface CompletedOperationItemVM {
  id: string;
  title: string;
  type: OperationType;
  customerName: string;
  technicianName: string;
  region: RegionName;
  completedAt: string;
  duration: number;
}

export interface DashboardMetricsVM {
  activeTickets: number;
  activeTicketsChange: number;
  activeTechnicians: number;
  activeTechniciansChange: number;
  pendingDispatch: number;
  pendingDispatchChange: number;
  highPriority: number;
  highPriorityChange: number;
  overdueJobs: number;
  overdueJobsChange: number;
  completedToday: number;
  completedTodayChange: number;
}

export interface LiveMetricVM {
  label: string;
  value: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface RegionalStatusVM {
  region: RegionName;
  regionName: string;
  activeOperations: number;
  availableTechnicians: number;
  overdueCount: number;
  color: string;
}

import type {
  Ticket,
  Appointment,
  Dispute,
  Task,
  OperationsLogEntry,
} from '../../../../packages/types';

export type {
  Ticket,
  Appointment,
  Dispute,
  Task,
  OperationsLogEntry,
};

export interface DashboardData {
  tickets: Ticket[];
  appointments: Appointment[];
  disputes: Dispute[];
  tasks: Task[];
}

export interface KpiSummary {
  openTickets: number;
  urgentTickets: number;
  activeAppointments: number;
  inProgressAppointments: number;
  openDisputes: number;
  awaitingApprovalDisputes: number;
  overdueTasks: number;
  hasOverdueTasks: boolean;
}

export interface CoordinatorRecommendation {
  type: string;
  summary: string;
  priority: string;
  rationale?: string;
  target_id?: string;
  task_id?: string;
}

export interface CoordinatorResponse {
  summary: string;
  recommendations: CoordinatorRecommendation[];
  coordination_status: string;
  summary_counts?: Record<string, number>;
  tasks_created?: Record<string, unknown>[];
  connector_actions?: { connector: string; action: string; status: string }[];
}

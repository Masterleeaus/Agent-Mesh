import type { AppointmentDTO, TechnicianDTO, AppointmentHistoryEventDTO, AppointmentStatsDTO } from './dto';

export interface AppointmentCardVM {
  id: string;
  customerName: string;
  serviceTypeName: string;
  technicianName: string;
  timeSlot: string;
  date: string;
  status: string;
  statusVariant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  durationMinutes: number;
  type: string;
}

export interface ScheduleDayVM {
  date: string;
  dayLabel: string;
  dayNum: number;
  appointments: AppointmentCardVM[];
}

export interface TechnicianScheduleVM {
  technicianId: string;
  technicianName: string;
  date: string;
  slots: { time: string; appointment: AppointmentDTO | null }[];
}

export interface ServiceTypeListItemVM {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  requiredSkills: string[];
  bufferMinutes: number;
  appointmentCount: number;
}

export interface BookingWizardStepVM {
  step: number;
  title: string;
  description: string;
}

export interface ConflictWarningVM {
  type: 'time_overlap' | 'technician_unavailable' | 'overtime' | 'skill_mismatch' | 'date_in_past';
  message: string;
}

export interface TechSuggestionVM {
  technician: TechnicianDTO;
  confidence: number;
  matchReasons: string[];
}

export interface DashboardStatsVM {
  totalToday: number;
  completedToday: number;
  pendingToday: number;
  overdue: number;
  pendingAssignment: number;
  upcomingCount: number;
  cancelledCount: number;
  averageDuration: number;
  onTimeRate: number;
  changeFromYesterday: number;
}

export interface AppointmentQueueItemVM {
  id: string;
  customerName: string;
  serviceTypeName: string;
  technicianName: string;
  date: string;
  timeSlot: string;
  status: string;
  statusVariant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  type: string;
  durationMinutes: number;
  createdAt: string;
}

export interface TimelineGroupVM {
  date: string;
  label: string;
  appointments: AppointmentCardVM[];
}

export interface AppointmentHistoryVM {
  events: AppointmentHistoryEventVM[];
  total: number;
}

export interface AppointmentHistoryEventVM {
  id: string;
  eventType: string;
  description: string;
  actorName: string;
  timestamp: string;
  icon: string;
  iconColor: string;
  appointmentId: string;
  customerName: string;
}

export interface ReportStatsVM {
  period: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  cancellationRate: number;
  averageDuration: number;
  onTimeRate: number;
  byStatus: { status: string; count: number }[];
  byTechnician: { name: string; count: number; completed: number }[];
  byServiceType: { name: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
}

export interface AppointmentDetailVM {
  appointment: AppointmentDTO;
  timeline: AppointmentHistoryEventDTO[];
}

export interface SearchResultVM {
  type: 'appointment' | 'customer' | 'technician';
  id: string;
  title: string;
  subtitle: string;
  matchField: string;
}

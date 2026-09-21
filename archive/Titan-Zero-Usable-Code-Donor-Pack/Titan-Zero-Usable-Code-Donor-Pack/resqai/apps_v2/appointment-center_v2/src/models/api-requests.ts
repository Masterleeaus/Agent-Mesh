import type { AppointmentType } from './dto';

export interface CreateAppointmentRequest {
  customerId: string;
  serviceTypeId: string;
  date: string;
  timeSlot: string;
  technicianId: string;
  type: AppointmentType;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

export interface UpdateAppointmentRequest {
  serviceTypeId?: string;
  date?: string;
  timeSlot?: string;
  technicianId?: string;
  type?: AppointmentType;
  notes?: string;
  status?: string;
}

export interface RescheduleRequest {
  newDate: string;
  newTimeSlot: string;
  reason: string;
}

export interface AssignTechnicianRequest {
  technicianId: string;
  notes?: string;
}

export interface CancelAppointmentRequest {
  reason: string;
  cancelledBy: string;
}

export interface CompleteAppointmentRequest {
  notes: string;
  completedBy: string;
}

export interface CreateServiceTypeRequest {
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  requiredSkills: string[];
  bufferMinutes: number;
}

export interface UpdateServiceTypeRequest {
  name?: string;
  description?: string;
  category?: string;
  durationMinutes?: number;
  requiredSkills?: string[];
  bufferMinutes?: number;
  isActive?: boolean;
}

export interface AppointmentListFilters {
  status?: string[];
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  technicianId?: string;
  serviceTypeId?: string;
  type?: AppointmentType;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GenerateReportRequest {
  dateFrom: string;
  dateTo: string;
  groupBy?: 'day' | 'week' | 'month' | 'technician' | 'service_type';
}

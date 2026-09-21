export enum AppointmentStatus {
  Scheduled = 'scheduled',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
  Rescheduled = 'rescheduled',
}

export enum ServiceCategory {
  Repair = 'repair',
  Maintenance = 'maintenance',
  Installation = 'installation',
  Inspection = 'inspection',
  Consultation = 'consultation',
}

export enum TechnicianSkill {
  Electrical = 'electrical',
  Plumbing = 'plumbing',
  HVAC = 'hvac',
  Carpentry = 'carpentry',
  Painting = 'painting',
  General = 'general',
}

export enum AppointmentType {
  Standard = 'standard',
  Emergency = 'emergency',
  FollowUp = 'follow_up',
  Recurring = 'recurring',
}

export interface AppointmentDTO {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  serviceTypeId: string;
  serviceTypeName: string;
  serviceCategory: ServiceCategory;
  technicianId: string;
  technicianName: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  status: AppointmentStatus;
  type: AppointmentType;
  notes: string;
  reason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  rescheduledFrom?: string;
  rescheduledAt?: string;
  completedAt?: string;
  completedNotes?: string;
  assignedAt?: string;
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: TechnicianSkill[];
  rating: number;
  availability: string[];
  activeAppointments: number;
  completedToday: number;
  nextAvailable: string;
  isOnline: boolean;
  location: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  createdAt: string;
  totalAppointments: number;
  lastAppointment: string;
}

export interface ServiceTypeDTO {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  durationMinutes: number;
  requiredSkills: TechnicianSkill[];
  bufferMinutes: number;
  isActive: boolean;
}

export interface TimeSlotDTO {
  start: string;
  end: string;
  available: boolean;
  label: string;
  technicianId?: string;
}

export interface AppointmentHistoryEventDTO {
  id: string;
  appointmentId: string;
  eventType: 'created' | 'assigned' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show' | 'confirmed' | 'in_progress' | 'updated';
  description: string;
  actorName: string;
  actorRole: 'system' | 'agent' | 'customer';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AppointmentStatsDTO {
  totalToday: number;
  completedToday: number;
  pendingToday: number;
  overdue: number;
  pendingAssignment: number;
  upcomingCount: number;
  cancelledCount: number;
  averageDuration: number;
  onTimeRate: number;
}

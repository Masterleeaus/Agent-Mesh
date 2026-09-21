import type { JobDTO, CustomerDTO, ChecklistDTO, ServiceNoteDTO, PartDTO, EvidenceDTO, MessageDTO, NotificationDTO, TimelineEventDTO, JobStatus, ServiceType, JobPriority } from './dto';

export interface JobListItemVM {
  id: string;
  title: string;
  customerName: string;
  customerAddress: string;
  serviceType: ServiceType;
  priority: JobPriority;
  status: JobStatus;
  scheduledStart: string;
  scheduledEnd: string;
  estimatedDuration: number;
  isUrgent: boolean;
  isEscalated: boolean;
  latitude?: number;
  longitude?: number;
  travelDistance?: number;
  travelDuration?: number;
}

export interface JobDetailVM {
  job: JobDTO;
  customer: CustomerDTO;
  checklist?: ChecklistDTO;
  notes: ServiceNoteDTO[];
  parts: PartDTO[];
  evidence: EvidenceDTO[];
  signature?: { id: string; data: string; customerName: string; signedAt: string };
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: 'technician' | 'dispatcher' | 'operations' | 'system';
    body: string;
    read: boolean;
    createdAt: string;
  }[];
  timeline: TimelineEventDTO[];
}

export interface DashboardVM {
  todayJobs: JobListItemVM[];
  currentJob?: JobListItemVM;
  nextAppointment?: JobListItemVM;
  urgentJobs: JobListItemVM[];
  completionRate: number;
  totalJobsToday: number;
  completedJobsToday: number;
  unreadMessages: number;
  unreadNotifications: number;
  travelStatus?: {
    distance: number;
    duration: number;
    destination: string;
  };
}

export interface MessageVM {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'technician' | 'dispatcher' | 'operations' | 'system';
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationVM {
  id: string;
  jobId?: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  timeAgo: string;
}

export interface TechnicianProfileVM {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  isOnline: boolean;
  skills: string[];
  certifications: string[];
  todayCompleted: number;
  todayTotal: number;
  completionRate: number;
}

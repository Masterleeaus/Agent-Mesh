export type JobStatus = 'assigned' | 'en_route' | 'on_site' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'escalated';
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ServiceType = 'installation' | 'repair' | 'maintenance' | 'inspection' | 'emergency' | 'follow_up';
export type EvidenceType = 'photo' | 'video' | 'signature';
export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface JobDTO {
  id: string;
  appointmentId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  serviceType: ServiceType;
  priority: JobPriority;
  status: JobStatus;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  estimatedDuration: number;
  technicianId?: string;
  technicianName?: string;
  checklistId?: string;
  notes?: string;
  partsRequired?: string[];
  escalationReason?: string;
  escalatedTo?: string;
  pauseReason?: string;
  pausedAt?: string;
  completedAt?: string;
  completionNotes?: string;
  signatureData?: string;
  latitude?: number;
  longitude?: number;
  travelDistance?: number;
  travelDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  accountId?: string;
  accountName?: string;
  notes?: string;
  preferredContact: 'phone' | 'email' | 'sms';
  createdAt: string;
}

export interface TechnicianDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
  isOnline: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  skills: string[];
  certifications: string[];
}

export interface ChecklistItemDTO {
  id: string;
  checklistId: string;
  label: string;
  required: boolean;
  order: number;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ChecklistDTO {
  id: string;
  jobId: string;
  name: string;
  items: ChecklistItemDTO[];
}

export interface ServiceNoteDTO {
  id: string;
  jobId: string;
  technicianId: string;
  technicianName: string;
  content: string;
  category: 'observation' | 'diagnosis' | 'resolution' | 'recommendation' | 'customer_request' | 'other';
  createdAt: string;
}

export interface PartDTO {
  id: string;
  jobId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
  usedAt: string;
}

export interface EvidenceDTO {
  id: string;
  jobId: string;
  type: EvidenceType;
  url?: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface SignatureDTO {
  id: string;
  jobId: string;
  data: string;
  customerName: string;
  signedAt: string;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: 'technician' | 'dispatcher' | 'operations' | 'system';
  body: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  jobId?: string;
  type: 'job_assigned' | 'job_updated' | 'schedule_change' | 'message' | 'escalation' | 'sync_error' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface TimelineEventDTO {
  id: string;
  jobId: string;
  type: string;
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

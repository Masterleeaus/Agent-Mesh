export enum TicketStatus {
  Open = 'open',
  InProgress = 'in_progress',
  WaitingOnCustomer = 'waiting_on_customer',
  WaitingOnInternal = 'waiting_on_internal',
  Resolved = 'resolved',
  Closed = 'closed',
}

export enum AppointmentStatus {
  Scheduled = 'scheduled',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  NoShow = 'no_show',
}

export enum DisputeStatus {
  Filed = 'filed',
  UnderReview = 'under_review',
  Investigation = 'investigation',
  ResolutionProposed = 'resolution_proposed',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Escalated = 'escalated',
  Closed = 'closed',
}

export enum HealthStatus {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Critical = 'critical',
}

export enum RequestType {
  Support = 'support',
  Billing = 'billing',
  Technical = 'technical',
  General = 'general',
  Complaint = 'complaint',
}

export enum Channel {
  Email = 'email',
  Phone = 'phone',
  Chat = 'chat',
  Portal = 'portal',
}

export enum NotificationChannel {
  Email = 'email',
  SMS = 'sms',
  InApp = 'in_app',
}

export enum PaymentStatus {
  Pending = 'pending',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum FeedbackCategory {
  Service = 'service',
  Technician = 'technician',
  Billing = 'billing',
  Support = 'support',
  General = 'general',
}

export enum MessageDirection {
  Inbound = 'inbound',
  Outbound = 'outbound',
}

export enum TechnicianStatus {
  EnRoute = 'en_route',
  OnSite = 'on_site',
  InProgress = 'in_progress',
  Completed = 'completed',
}

export interface CustomerDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDTO {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  requestType: RequestType;
  channel: Channel;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  customerId: string;
}

export interface AppointmentDTO {
  id: string;
  serviceType: string;
  status: AppointmentStatus;
  scheduledDate: string;
  scheduledTime: string;
  technicianName: string | null;
  technicianPhone: string | null;
  notes: string | null;
  address: string;
  createdAt: string;
  updatedAt: string;
  estimatedDuration: number;
  customerId: string;
}

export interface DisputeDTO {
  id: string;
  subject: string;
  description: string;
  status: DisputeStatus;
  filedDate: string;
  resolutionDate: string | null;
  resolution: string | null;
  relatedTicketId: string | null;
}

export interface AccountDTO {
  id: string;
  customerId: string;
  accountNumber: string;
  status: string;
  healthScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface FollowupDTO {
  id: string;
  ticketId: string;
  note: string;
  status: string;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
}

export interface NotificationPreferenceDTO {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  ticketUpdates: boolean;
  appointmentReminders: boolean;
  promotional: boolean;
}

export interface InvoiceDTO {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  issuedDate: string;
  dueDate: string;
  paidDate: string | null;
  lineItems: InvoiceLineItemDTO[];
  relatedAppointmentId: string | null;
}

export interface InvoiceLineItemDTO {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentDTO {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  paidAt: string;
  receiptUrl: string | null;
}

export interface MessageDTO {
  id: string;
  ticketId: string | null;
  subject: string;
  body: string;
  direction: MessageDirection;
  senderName: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: 'ticket' | 'appointment' | 'billing' | 'system';
  read: boolean;
  createdAt: string;
  link: string | null;
}

export interface FeedbackDTO {
  id: string;
  category: FeedbackCategory;
  rating: number;
  comment: string;
  relatedAppointmentId: string | null;
  relatedTicketId: string | null;
  createdAt: string;
}

export interface KnowledgeBaseArticleDTO {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  helpfulCount: number;
  notHelpfulCount: number;
  updatedAt: string;
}

export interface DownloadDTO {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileSize: string;
  category: string;
  updatedAt: string;
}

export interface TechnicianTrackingDTO {
  appointmentId: string;
  technicianName: string;
  technicianPhone: string;
  status: TechnicianStatus;
  etaMinutes: number | null;
  currentLocation: string | null;
  estimatedArrival: string | null;
  lastUpdated: string;
}

export interface ServiceRecordDTO {
  id: string;
  appointmentId: string;
  serviceType: string;
  scheduledDate: string;
  technicianName: string;
  status: AppointmentStatus;
  notes: string | null;
  completedAt: string | null;
}

export interface SecuritySettingDTO {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: ActiveSessionDTO[];
}

export interface ActiveSessionDTO {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

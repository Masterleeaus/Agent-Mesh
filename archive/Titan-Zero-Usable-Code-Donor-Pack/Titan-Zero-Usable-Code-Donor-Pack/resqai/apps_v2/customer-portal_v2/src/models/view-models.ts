import { TicketStatus, AppointmentStatus, DisputeStatus, HealthStatus, PaymentStatus, FeedbackCategory } from './dto';

export interface HomeDashboardVM {
  customerName: string;
  healthScore: number;
  healthStatus: HealthStatus;
  openTicketsCount: number;
  upcomingAppointment: UpcomingAppointmentVM | null;
  recentActivity: ActivityVM[];
  unreadNotifications: number;
  activeAppointments: number;
}

export interface UpcomingAppointmentVM {
  id: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: AppointmentStatus;
  technicianName: string | null;
}

export interface ActivityVM {
  id: string;
  type: 'ticket' | 'appointment' | 'dispute' | 'billing' | 'feedback';
  description: string;
  timestamp: string;
  link: string | null;
}

export interface TicketListItemVM {
  id: string;
  subject: string;
  status: TicketStatus;
  requestType: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  hasUnreadMessages: boolean;
}

export interface AppointmentListItemVM {
  id: string;
  serviceType: string;
  status: AppointmentStatus;
  scheduledDate: string;
  scheduledTime: string;
  technicianName: string | null;
}

export interface DisputeListItemVM {
  id: string;
  subject: string;
  status: DisputeStatus;
  filedDate: string;
  resolutionDate: string | null;
}

export interface AccountHealthVM {
  healthScore: number;
  healthStatus: HealthStatus;
  openTicketsCount: number;
  resolvedTicketsCount: number;
  upcomingAppointmentsCount: number;
  completedAppointmentsCount: number;
  pendingFollowupsCount: number;
  accountAge: string;
}

export interface ProfileVM {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface BookingStepVM {
  step: number;
  title: string;
  completed: boolean;
  active: boolean;
}

export interface InvoiceListItemVM {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  issuedDate: string;
  dueDate: string;
}

export interface PaymentListItemVM {
  id: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  paidAt: string;
}

export interface MessageListItemVM {
  id: string;
  subject: string;
  senderName: string;
  preview: string;
  createdAt: string;
  unread: boolean;
  ticketId: string | null;
}

export interface NotificationListItemVM {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link: string | null;
}

export interface FeedbackListItemVM {
  id: string;
  category: FeedbackCategory;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface KnowledgeBaseListItemVM {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  helpfulCount: number;
}

export interface DownloadListItemVM {
  id: string;
  name: string;
  description: string;
  fileSize: string;
  category: string;
}

export interface ServiceHistoryListItemVM {
  id: string;
  serviceType: string;
  scheduledDate: string;
  technicianName: string;
  status: AppointmentStatus;
  completedAt: string | null;
}

export interface TechnicianTrackingVM {
  appointmentId: string;
  technicianName: string;
  technicianPhone: string;
  status: string;
  etaMinutes: number | null;
  currentLocation: string | null;
  estimatedArrival: string | null;
  lastUpdated: string;
  serviceType: string;
}

export interface QuickActionVM {
  id: string;
  label: string;
  icon: string;
  route: string;
  description: string;
}

export interface CustomerSatisfactionVM {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface AppointmentCalendarVM {
  date: string;
  appointments: AppointmentListItemVM[];
}
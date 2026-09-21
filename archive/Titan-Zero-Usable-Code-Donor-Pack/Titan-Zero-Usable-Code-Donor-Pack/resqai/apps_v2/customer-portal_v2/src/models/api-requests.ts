import { RequestType, Channel, FeedbackCategory } from './dto';

export interface CreateTicketRequest {
  subject: string;
  message: string;
  requestType: RequestType;
  channel: Channel;
  phone: string;
  email: string;
}

export interface UpdateTicketRequest {
  ticketId: string;
  message: string;
}

export interface BookAppointmentRequest {
  serviceType: string;
  date: string;
  timeSlot: string;
}

export interface RescheduleRequest {
  appointmentId: string;
  newDate: string;
  newTimeSlot: string;
  reason?: string;
}

export interface CancelAppointmentRequest {
  appointmentId: string;
  reason: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateNotificationPreferencesRequest {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  ticketUpdates: boolean;
  appointmentReminders: boolean;
  promotional: boolean;
}

export interface SubmitFeedbackRequest {
  category: FeedbackCategory;
  rating: number;
  comment: string;
  relatedAppointmentId?: string;
  relatedTicketId?: string;
}

export interface MakePaymentRequest {
  invoiceId: string;
  amount: number;
  method: string;
}

export interface SendMessageRequest {
  ticketId: string;
  body: string;
}

export interface UpdateTicketStatusRequest {
  ticketId: string;
  status: string;
}

export interface EnableTwoFactorRequest {
  enable: boolean;
  phone: string;
}
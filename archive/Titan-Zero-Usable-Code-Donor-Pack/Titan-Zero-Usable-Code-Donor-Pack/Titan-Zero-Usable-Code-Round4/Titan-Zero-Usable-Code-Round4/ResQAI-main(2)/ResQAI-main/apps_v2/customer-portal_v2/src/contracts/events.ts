export const CustomerPortalEvents = {
  TicketCreated: 'ticket.created.customer',
  TicketMessageSent: 'ticket.message.sent.customer',
  AppointmentRequested: 'appointment.requested',
  AppointmentRescheduled: 'appointment.rescheduled.customer',
  AppointmentCancelled: 'appointment.cancelled.customer',
  PaymentMade: 'payment.made.customer',
  FeedbackSubmitted: 'feedback.submitted.customer',
  PasswordChanged: 'password.changed.customer',
  ProfileUpdated: 'profile.updated.customer',
  NotificationRead: 'notification.read.customer',
  TwoFactorToggled: 'two_factor.toggled.customer',
} as const;

export interface TicketCreatedPayload {
  ticketId: string;
  subject: string;
  requestType: string;
}

export interface TicketMessageSentPayload {
  ticketId: string;
  messageId: string;
}

export interface AppointmentRequestedPayload {
  appointmentId: string;
  serviceType: string;
  scheduledDate: string;
}

export interface AppointmentRescheduledPayload {
  appointmentId: string;
  newDate: string;
  newTime: string;
}

export interface AppointmentCancelledPayload {
  appointmentId: string;
  reason: string;
}

export interface PaymentMadePayload {
  invoiceId: string;
  amount: number;
  method: string;
}

export interface FeedbackSubmittedPayload {
  feedbackId: string;
  rating: number;
  category: string;
}

export interface PasswordChangedPayload {
  timestamp: string;
}

export interface ProfileUpdatedPayload {
  fields: string[];
}

export interface TwoFactorToggledPayload {
  enabled: boolean;
}
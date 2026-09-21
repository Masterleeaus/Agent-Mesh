import {
  TicketDTO, AppointmentDTO, DisputeDTO, AccountDTO, FollowupDTO,
  NotificationPreferenceDTO, InvoiceDTO, PaymentDTO, MessageDTO,
  NotificationDTO, FeedbackDTO, KnowledgeBaseArticleDTO, DownloadDTO,
  TechnicianTrackingDTO, ServiceRecordDTO, SecuritySettingDTO, ActiveSessionDTO,
  TicketStatus, AppointmentStatus, DisputeStatus, HealthStatus,
  RequestType, Channel, PaymentStatus, FeedbackCategory,
  MessageDirection, TechnicianStatus,
} from '../models/dto';
import {
  HomeDashboardVM, UpcomingAppointmentVM, ActivityVM, AccountHealthVM,
  ProfileVM, InvoiceListItemVM, PaymentListItemVM, MessageListItemVM,
  NotificationListItemVM, FeedbackListItemVM, KnowledgeBaseListItemVM,
  DownloadListItemVM, ServiceHistoryListItemVM, TechnicianTrackingVM,
  CustomerSatisfactionVM,
} from '../models/view-models';
import {
  CreateTicketRequest, BookAppointmentRequest, RescheduleRequest,
  CancelAppointmentRequest, UpdateProfileRequest,
  UpdateNotificationPreferencesRequest, SubmitFeedbackRequest,
  MakePaymentRequest, SendMessageRequest, ChangePasswordRequest,
  UpdateTicketRequest, EnableTwoFactorRequest,
} from '../models/api-requests';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const CustomerService = {
  async getDashboard(): Promise<HomeDashboardVM> {
    await delay(400);
    return {
      customerName: 'Jane Cooper',
      healthScore: 78,
      healthStatus: HealthStatus.Good,
      openTicketsCount: 3,
      upcomingAppointment: {
        id: 'apt-001', serviceType: 'HVAC Maintenance',
        scheduledDate: '2026-07-15', scheduledTime: '09:00',
        status: AppointmentStatus.Confirmed, technicianName: 'Mike Johnson',
      },
      recentActivity: [
        { id: 'act-1', type: 'ticket', description: 'Ticket #T-1003 updated to In Progress', timestamp: '2026-06-28T14:30:00Z', link: '/tickets/T-1003' },
        { id: 'act-2', type: 'appointment', description: 'Appointment scheduled for HVAC Maintenance', timestamp: '2026-06-27T10:15:00Z', link: '/appointments/apt-001' },
        { id: 'act-3', type: 'billing', description: 'Invoice #INV-2026-07 generated', timestamp: '2026-06-26T08:45:00Z', link: '/invoices/inv-001' },
        { id: 'act-4', type: 'feedback', description: 'Feedback submitted for service on Jun 10', timestamp: '2026-06-25T16:00:00Z', link: '/feedback' },
      ],
      unreadNotifications: 2,
      activeAppointments: 1,
    };
  },

  async getCustomerSatisfaction(): Promise<CustomerSatisfactionVM> {
    await delay(200);
    return { averageRating: 4.2, totalReviews: 12, ratingDistribution: { 5: 6, 4: 4, 3: 1, 2: 1, 1: 0 } };
  },

  async listTickets(page = 1, pageSize = 10): Promise<{ tickets: TicketDTO[]; total: number }> {
    await delay(300);
    const tickets: TicketDTO[] = [
      { id: 'T-1001', customerId: 'cust-001', subject: 'Water heater not heating', message: 'No hot water since yesterday', status: TicketStatus.Open, requestType: RequestType.Support, channel: Channel.Portal, priority: 'high', assignedTo: null, createdAt: '2026-06-25T08:00:00Z', updatedAt: '2026-06-25T08:00:00Z', resolvedAt: null },
      { id: 'T-1002', customerId: 'cust-001', subject: 'Billing discrepancy on June invoice', message: 'Charged twice for service fee', status: TicketStatus.InProgress, requestType: RequestType.Billing, channel: Channel.Email, priority: 'medium', assignedTo: 'Support Agent A', createdAt: '2026-06-20T09:30:00Z', updatedAt: '2026-06-22T11:00:00Z', resolvedAt: null },
      { id: 'T-1003', customerId: 'cust-001', subject: 'AC unit making strange noise', message: 'Loud rattling from outdoor unit', status: TicketStatus.WaitingOnCustomer, requestType: RequestType.Technical, channel: Channel.Phone, priority: 'medium', assignedTo: 'Support Agent B', createdAt: '2026-06-18T14:00:00Z', updatedAt: '2026-06-21T16:00:00Z', resolvedAt: null },
    ];
    return { tickets, total: tickets.length };
  },

  async getTicket(id: string): Promise<TicketDTO | null> {
    await delay(200);
    const result = await CustomerService.listTickets();
    return result.tickets.find((t) => t.id === id) ?? null;
  },

  async createTicket(req: CreateTicketRequest): Promise<TicketDTO> {
    await delay(500);
    return {
      id: `T-${Date.now()}`, customerId: 'cust-001', subject: req.subject, message: req.message,
      status: TicketStatus.Open, requestType: req.requestType, channel: req.channel,
      priority: 'medium', assignedTo: null, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), resolvedAt: null,
    };
  },

  async updateTicket(req: UpdateTicketRequest): Promise<TicketDTO> {
    await delay(400);
    const existing = await CustomerService.getTicket(req.ticketId);
    if (!existing) throw new Error('Ticket not found');
    return { ...existing, message: existing.message + '\n\n' + req.message, updatedAt: new Date().toISOString() };
  },

  async listAppointments(page = 1, pageSize = 10): Promise<{ appointments: AppointmentDTO[]; total: number }> {
    await delay(300);
    const appointments: AppointmentDTO[] = [
      { id: 'apt-001', customerId: 'cust-001', serviceType: 'HVAC Maintenance', status: AppointmentStatus.Confirmed, scheduledDate: '2026-07-15', scheduledTime: '09:00', technicianName: 'Mike Johnson', technicianPhone: '+1-555-0101', notes: 'Annual maintenance', address: '123 Main St, Springfield', createdAt: '2026-06-27T10:00:00Z', updatedAt: '2026-06-27T10:00:00Z', estimatedDuration: 120 },
      { id: 'apt-002', customerId: 'cust-001', serviceType: 'Plumbing Inspection', status: AppointmentStatus.Completed, scheduledDate: '2026-06-10', scheduledTime: '14:00', technicianName: 'Sarah Lee', technicianPhone: '+1-555-0102', notes: 'Leak under sink repaired', address: '123 Main St, Springfield', createdAt: '2026-06-01T08:00:00Z', updatedAt: '2026-06-10T15:00:00Z', estimatedDuration: 60 },
      { id: 'apt-003', customerId: 'cust-001', serviceType: 'Electrical Service', status: AppointmentStatus.Scheduled, scheduledDate: '2026-07-20', scheduledTime: '10:00', technicianName: 'Tom Brown', technicianPhone: '+1-555-0103', notes: null, address: '123 Main St, Springfield', createdAt: '2026-07-01T09:00:00Z', updatedAt: '2026-07-01T09:00:00Z', estimatedDuration: 90 },
    ];
    return { appointments, total: appointments.length };
  },

  async getAppointment(id: string): Promise<AppointmentDTO | null> {
    await delay(200);
    const result = await CustomerService.listAppointments();
    return result.appointments.find((a) => a.id === id) ?? null;
  },

  async bookAppointment(req: BookAppointmentRequest): Promise<AppointmentDTO> {
    await delay(500);
    return {
      id: `apt-${Date.now()}`, customerId: 'cust-001', serviceType: req.serviceType,
      status: AppointmentStatus.Scheduled, scheduledDate: req.date, scheduledTime: req.timeSlot,
      technicianName: null, technicianPhone: null, notes: null,
      address: '123 Main St, Springfield', createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), estimatedDuration: 90,
    };
  },

  async rescheduleAppointment(req: RescheduleRequest): Promise<AppointmentDTO> {
    await delay(400);
    const existing = await CustomerService.getAppointment(req.appointmentId);
    if (!existing) throw new Error('Appointment not found');
    return { ...existing, scheduledDate: req.newDate, scheduledTime: req.newTimeSlot, status: AppointmentStatus.Scheduled, updatedAt: new Date().toISOString() };
  },

  async cancelAppointment(req: CancelAppointmentRequest): Promise<void> {
    await delay(300);
  },

  async listInvoices(page = 1, pageSize = 10): Promise<{ invoices: InvoiceListItemVM[]; total: number }> {
    await delay(300);
    const invoices: InvoiceListItemVM[] = [
      { id: 'inv-001', invoiceNumber: 'INV-2026-001', amount: 350.00, paidAmount: 350.00, status: PaymentStatus.Paid, issuedDate: '2026-06-01', dueDate: '2026-06-15' },
      { id: 'inv-002', invoiceNumber: 'INV-2026-002', amount: 520.00, paidAmount: 0, status: PaymentStatus.Pending, issuedDate: '2026-06-15', dueDate: '2026-06-30' },
      { id: 'inv-003', invoiceNumber: 'INV-2026-003', amount: 275.00, paidAmount: 0, status: PaymentStatus.Overdue, issuedDate: '2026-05-15', dueDate: '2026-05-30' },
    ];
    return { invoices, total: invoices.length };
  },

  async getInvoice(id: string): Promise<InvoiceDTO | null> {
    await delay(200);
    return {
      id, invoiceNumber: 'INV-2026-002', amount: 520.00, paidAmount: 0,
      status: PaymentStatus.Pending, issuedDate: '2026-06-15', dueDate: '2026-06-30',
      paidDate: null,
      lineItems: [
        { description: 'HVAC Maintenance Service', quantity: 1, unitPrice: 350.00, total: 350.00 },
        { description: 'Replacement Filter', quantity: 2, unitPrice: 25.00, total: 50.00 },
        { description: 'Travel Fee', quantity: 1, unitPrice: 120.00, total: 120.00 },
      ],
      relatedAppointmentId: 'apt-001',
    };
  },

  async makePayment(req: MakePaymentRequest): Promise<PaymentDTO> {
    await delay(500);
    return {
      id: `pay-${Date.now()}`, invoiceId: req.invoiceId, invoiceNumber: 'INV-2026-002',
      amount: req.amount, method: req.method, status: PaymentStatus.Paid,
      paidAt: new Date().toISOString(), receiptUrl: null,
    };
  },

  async listPayments(page = 1, pageSize = 10): Promise<{ payments: PaymentListItemVM[]; total: number }> {
    await delay(300);
    const payments: PaymentListItemVM[] = [
      { id: 'pay-001', invoiceNumber: 'INV-2026-001', amount: 350.00, method: 'credit_card', status: PaymentStatus.Paid, paidAt: '2026-06-10T14:00:00Z' },
      { id: 'pay-002', invoiceNumber: 'INV-2025-012', amount: 200.00, method: 'bank_transfer', status: PaymentStatus.Paid, paidAt: '2025-12-01T09:00:00Z' },
    ];
    return { payments, total: payments.length };
  },

  async listDisputes(page = 1, pageSize = 10): Promise<{ disputes: DisputeDTO[]; total: number }> {
    await delay(300);
    const disputes: DisputeDTO[] = [
      { id: 'D-001', subject: 'Incorrect charge on invoice #INV-2026-06', description: 'Charged for service not performed', status: DisputeStatus.UnderReview, filedDate: '2026-06-26T08:00:00Z', resolutionDate: null, resolution: null, relatedTicketId: 'T-1002' },
      { id: 'D-002', subject: 'Service quality dispute', description: 'HVAC repair did not resolve issue', status: DisputeStatus.ResolutionProposed, filedDate: '2026-06-15T10:00:00Z', resolutionDate: '2026-06-20T12:00:00Z', resolution: 'Partial refund offered', relatedTicketId: 'T-1003' },
    ];
    return { disputes, total: disputes.length };
  },

  async getDispute(id: string): Promise<DisputeDTO | null> {
    await delay(200);
    const result = await CustomerService.listDisputes();
    return result.disputes.find((d) => d.id === id) ?? null;
  },

  async getProfile(): Promise<ProfileVM> {
    await delay(200);
    return { firstName: 'Jane', lastName: 'Cooper', email: 'jane.cooper@example.com', phone: '+1-555-0001', address: '123 Main St, Springfield, IL 62701' };
  },

  async updateProfile(req: UpdateProfileRequest): Promise<ProfileVM> {
    await delay(400);
    return { firstName: req.firstName, lastName: req.lastName, email: req.email, phone: req.phone, address: req.address };
  },

  async changePassword(req: ChangePasswordRequest): Promise<void> {
    await delay(400);
    if (req.newPassword !== req.confirmPassword) throw new Error('Passwords do not match');
  },

  async getAccountHealth(): Promise<{ account: AccountDTO; health: AccountHealthVM; followups: FollowupDTO[] }> {
    await delay(300);
    return {
      account: { id: 'acc-001', customerId: 'cust-001', accountNumber: 'ACC-2026-0001', status: 'active', healthScore: 78, createdAt: '2022-01-15T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
      health: { healthScore: 78, healthStatus: HealthStatus.Good, openTicketsCount: 3, resolvedTicketsCount: 15, upcomingAppointmentsCount: 2, completedAppointmentsCount: 8, pendingFollowupsCount: 2, accountAge: '4 years 5 months' },
      followups: [
        { id: 'fu-001', ticketId: 'T-1001', note: 'Check water heater replacement options', status: 'pending', dueDate: '2026-07-05', completedAt: null, createdAt: '2026-06-25T08:00:00Z' },
        { id: 'fu-002', ticketId: 'T-1003', note: 'Follow up on AC noise after repair', status: 'pending', dueDate: '2026-07-02', completedAt: null, createdAt: '2026-06-21T16:00:00Z' },
      ],
    };
  },

  async getNotificationPreferences(): Promise<NotificationPreferenceDTO> {
    await delay(200);
    return { email: true, sms: false, inApp: true, ticketUpdates: true, appointmentReminders: true, promotional: false };
  },

  async updateNotificationPreferences(req: UpdateNotificationPreferencesRequest): Promise<NotificationPreferenceDTO> {
    await delay(300);
    return { email: req.email, sms: req.sms, inApp: req.inApp, ticketUpdates: req.ticketUpdates, appointmentReminders: req.appointmentReminders, promotional: req.promotional };
  },

  async getAvailableSlots(date: string): Promise<string[]> {
    await delay(200);
    return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  },

  async listMessages(page = 1, pageSize = 20): Promise<{ messages: MessageListItemVM[]; total: number }> {
    await delay(300);
    const messages: MessageListItemVM[] = [
      { id: 'msg-001', subject: 'Re: Water heater not heating', senderName: 'Support Agent A', preview: 'We have scheduled a technician to inspect your water heater...', createdAt: '2026-06-26T10:00:00Z', unread: true, ticketId: 'T-1001' },
      { id: 'msg-002', subject: 'Billing discrepancy update', senderName: 'Support Agent B', preview: 'We are reviewing your billing dispute and will respond within...', createdAt: '2026-06-23T14:00:00Z', unread: false, ticketId: 'T-1002' },
      { id: 'msg-003', subject: 'AC unit follow-up', senderName: 'Support Team', preview: 'Have you had a chance to check if the noise persists after...', createdAt: '2026-06-22T09:00:00Z', unread: true, ticketId: 'T-1003' },
    ];
    return { messages, total: messages.length };
  },

  async getTicketMessages(ticketId: string): Promise<MessageDTO[]> {
    await delay(200);
    return [
      { id: `msg-${ticketId}-1`, ticketId, subject: 'Initial Report', body: 'I noticed the issue this morning. No hot water at all.', direction: MessageDirection.Outbound, senderName: 'Jane Cooper', createdAt: '2026-06-25T08:00:00Z', readAt: '2026-06-25T09:00:00Z' },
      { id: `msg-${ticketId}-2`, ticketId, subject: 'RE: Initial Report', body: 'Thank you for reaching out. We have assigned a technician to your case.', direction: MessageDirection.Inbound, senderName: 'Support Agent A', createdAt: '2026-06-25T10:00:00Z', readAt: null },
    ];
  },

  async sendMessage(req: SendMessageRequest): Promise<MessageDTO> {
    await delay(300);
    return {
      id: `msg-${Date.now()}`, ticketId: req.ticketId, subject: 'New Message',
      body: req.body, direction: MessageDirection.Outbound, senderName: 'Jane Cooper',
      createdAt: new Date().toISOString(), readAt: null,
    };
  },

  async listNotifications(page = 1, pageSize = 20): Promise<{ notifications: NotificationListItemVM[]; total: number; unreadCount: number }> {
    await delay(300);
    const notifications: NotificationListItemVM[] = [
      { id: 'notif-001', title: 'Technician En Route', message: 'Mike Johnson is on his way for your HVAC Maintenance appointment.', type: 'appointment', read: false, createdAt: '2026-07-15T08:00:00Z', link: '/appointments/apt-001' },
      { id: 'notif-002', title: 'New Message on T-1003', message: 'Support Agent B asked for more details about the AC noise.', type: 'ticket', read: false, createdAt: '2026-06-28T14:30:00Z', link: '/tickets/T-1003' },
      { id: 'notif-003', title: 'Invoice Overdue', message: 'Invoice #INV-2026-003 is now overdue.', type: 'billing', read: true, createdAt: '2026-06-01T00:00:00Z', link: '/invoices/inv-003' },
      { id: 'notif-004', title: 'Appointment Reminder', message: 'You have an appointment tomorrow at 09:00.', type: 'appointment', read: true, createdAt: '2026-07-14T09:00:00Z', link: '/appointments/apt-001' },
    ];
    return { notifications, total: notifications.length, unreadCount: notifications.filter((n) => !n.read).length };
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
  },

  async markAllNotificationsRead(): Promise<void> {
    await delay(200);
  },

  async submitFeedback(req: SubmitFeedbackRequest): Promise<FeedbackDTO> {
    await delay(400);
    return {
      id: `fb-${Date.now()}`, category: req.category, rating: req.rating,
      comment: req.comment, relatedAppointmentId: req.relatedAppointmentId ?? null,
      relatedTicketId: req.relatedTicketId ?? null, createdAt: new Date().toISOString(),
    };
  },

  async listFeedback(page = 1, pageSize = 10): Promise<{ feedback: FeedbackListItemVM[]; total: number }> {
    await delay(300);
    const feedback: FeedbackListItemVM[] = [
      { id: 'fb-001', category: FeedbackCategory.Service, rating: 4, comment: 'Good service, technician was on time.', createdAt: '2026-06-10T15:00:00Z' },
      { id: 'fb-002', category: FeedbackCategory.Technician, rating: 5, comment: 'Sarah was very professional and helpful.', createdAt: '2026-05-20T12:00:00Z' },
    ];
    return { feedback, total: feedback.length };
  },

  async searchKnowledgeBase(query: string, page = 1): Promise<{ articles: KnowledgeBaseListItemVM[]; total: number }> {
    await delay(300);
    const allArticles: KnowledgeBaseListItemVM[] = [
      { id: 'kb-001', title: 'How to reset your HVAC system', summary: 'Step-by-step guide to reset your HVAC system after a power outage.', category: 'HVAC', tags: ['hvac', 'reset', 'maintenance'], helpfulCount: 24 },
      { id: 'kb-002', title: 'Understanding your invoice', summary: 'Learn how to read and understand your service invoices.', category: 'Billing', tags: ['billing', 'invoice', 'payment'], helpfulCount: 18 },
      { id: 'kb-003', title: 'What to expect during a service visit', summary: 'Know what happens when a technician arrives at your home.', category: 'Service', tags: ['technician', 'visit', 'preparation'], helpfulCount: 32 },
      { id: 'kb-004', title: 'How to book an appointment online', summary: 'Use the customer portal to schedule service appointments.', category: 'Portal', tags: ['appointment', 'booking', 'portal'], helpfulCount: 15 },
      { id: 'kb-005', title: 'Troubleshooting common AC issues', summary: 'Fix common air conditioning problems before calling for service.', category: 'HVAC', tags: ['ac', 'troubleshooting', 'cooling'], helpfulCount: 41 },
    ];
    if (!query) return { articles: allArticles, total: allArticles.length };
    const filtered = allArticles.filter((a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
    );
    return { articles: filtered, total: filtered.length };
  },

  async getKnowledgeBaseArticle(id: string): Promise<KnowledgeBaseArticleDTO | null> {
    await delay(200);
    const articles: Record<string, KnowledgeBaseArticleDTO> = {
      'kb-001': { id: 'kb-001', title: 'How to reset your HVAC system', summary: 'Step-by-step guide to reset your HVAC system after a power outage.', content: 'If your HVAC system stops working after a power outage, try these steps:\n\n1. Turn off the system at the thermostat.\n2. Locate the circuit breaker and turn it off.\n3. Wait 5 minutes.\n4. Turn the breaker back on.\n5. Turn the thermostat back on and set your desired temperature.\n\nIf the system still does not work, please contact support.', category: 'HVAC', tags: ['hvac', 'reset', 'maintenance'], helpfulCount: 24, notHelpfulCount: 3, updatedAt: '2026-06-01T00:00:00Z' },
      'kb-003': { id: 'kb-003', title: 'What to expect during a service visit', summary: 'Know what happens when a technician arrives at your home.', content: 'When our technician arrives for your appointment:\n\n1. The technician will knock and identify themselves.\n2. They will review the work order with you.\n3. They will inspect the issue and explain the repair plan.\n4. After completing the work, they will clean up the area.\n5. You will receive a summary of work completed.\n\nAppointments typically last 1-2 hours depending on the service.', category: 'Service', tags: ['technician', 'visit', 'preparation'], helpfulCount: 32, notHelpfulCount: 1, updatedAt: '2026-05-15T00:00:00Z' },
    };
    return articles[id] ?? null;
  },

  async markArticleHelpful(id: string, helpful: boolean): Promise<void> {
    await delay(100);
  },

  async listDownloads(page = 1, pageSize = 10): Promise<{ downloads: DownloadListItemVM[]; total: number }> {
    await delay(300);
    const downloads: DownloadListItemVM[] = [
      { id: 'dl-001', name: 'Service Agreement.pdf', description: 'Terms and conditions for residential services.', fileSize: '245 KB', category: 'Documents' },
      { id: 'dl-002', name: 'HVAC Maintenance Guide.pdf', description: 'Annual maintenance checklist for your HVAC system.', fileSize: '1.2 MB', category: 'Guides' },
      { id: 'dl-003', name: 'Warranty Information.pdf', description: 'Details about your service warranty coverage.', fileSize: '180 KB', category: 'Documents' },
      { id: 'dl-004', name: 'Mobile App Setup Guide.pdf', description: 'How to install and set up the ResQAI mobile app.', fileSize: '890 KB', category: 'Guides' },
    ];
    return { downloads, total: downloads.length };
  },

  async getServiceHistory(page = 1, pageSize = 10): Promise<{ services: ServiceHistoryListItemVM[]; total: number }> {
    await delay(300);
    const services: ServiceHistoryListItemVM[] = [
      { id: 'sh-001', serviceType: 'HVAC Maintenance', scheduledDate: '2026-06-10', technicianName: 'Sarah Lee', status: AppointmentStatus.Completed, completedAt: '2026-06-10T16:00:00Z' },
      { id: 'sh-002', serviceType: 'Plumbing Repair', scheduledDate: '2026-05-22', technicianName: 'Mike Johnson', status: AppointmentStatus.Completed, completedAt: '2026-05-22T12:30:00Z' },
      { id: 'sh-003', serviceType: 'Electrical Inspection', scheduledDate: '2026-04-15', technicianName: 'Tom Brown', status: AppointmentStatus.Completed, completedAt: '2026-04-15T11:00:00Z' },
      { id: 'sh-004', serviceType: 'AC Repair', scheduledDate: '2025-08-10', technicianName: 'Sarah Lee', status: AppointmentStatus.Completed, completedAt: '2025-08-10T15:00:00Z' },
    ];
    return { services, total: services.length };
  },

  async getTechnicianTracking(appointmentId: string): Promise<TechnicianTrackingVM | null> {
    await delay(200);
    return {
      appointmentId, technicianName: 'Mike Johnson', technicianPhone: '+1-555-0101',
      status: 'en_route', etaMinutes: 25, currentLocation: 'Springfield, IL',
      estimatedArrival: '2026-07-15T09:25:00Z', lastUpdated: new Date().toISOString(),
      serviceType: 'HVAC Maintenance',
    };
  },

  async getSecuritySettings(): Promise<SecuritySettingDTO> {
    await delay(200);
    return {
      twoFactorEnabled: false,
      lastPasswordChange: '2026-01-15T00:00:00Z',
      activeSessions: [
        { id: 'sess-001', deviceName: 'Chrome on Windows', ipAddress: '192.168.1.100', lastActive: '2026-06-28T15:00:00Z', current: true },
        { id: 'sess-002', deviceName: 'Safari on iPhone', ipAddress: '192.168.1.101', lastActive: '2026-06-27T20:00:00Z', current: false },
      ],
    };
  },

  async enableTwoFactor(req: EnableTwoFactorRequest): Promise<void> {
    await delay(500);
  },

  async revokeSession(sessionId: string): Promise<void> {
    await delay(200);
  },

  async getHelpCenterFAQs(): Promise<{ question: string; answer: string; category: string }[]> {
    await delay(200);
    return [
      { question: 'How do I reset my password?', answer: 'Go to Settings > Security and click "Change Password". You will need your current password.', category: 'Account' },
      { question: 'What payment methods do you accept?', answer: 'We accept credit/debit cards (Visa, Mastercard, Amex), bank transfers, and digital wallets.', category: 'Billing' },
      { question: 'Can I reschedule my appointment?', answer: 'Yes, go to your appointment details and click "Reschedule". You can choose a new date and time.', category: 'Appointments' },
      { question: 'How do I track my technician?', answer: 'Go to "Track Technician" from your dashboard or appointment details page to see live ETA.', category: 'Technician' },
      { question: 'What is your cancellation policy?', answer: 'You can cancel up to 24 hours before the scheduled time without any charge.', category: 'Appointments' },
      { question: 'How do I download my invoice?', answer: 'Go to the Invoices page, select an invoice, and click "Download" to get a PDF copy.', category: 'Billing' },
    ];
  },

  async getAppointmentCalendarAppointments(year: number, month: number): Promise<{ date: string; appointments: AppointmentListItemVM[] }[]> {
    await delay(300);
    return [
      { date: `2026-07-15`, appointments: [{ id: 'apt-001', serviceType: 'HVAC Maintenance', status: AppointmentStatus.Confirmed, scheduledDate: '2026-07-15', scheduledTime: '09:00', technicianName: 'Mike Johnson' }] },
      { date: `2026-07-20`, appointments: [{ id: 'apt-003', serviceType: 'Electrical Service', status: AppointmentStatus.Scheduled, scheduledDate: '2026-07-20', scheduledTime: '10:00', technicianName: 'Tom Brown' }] },
    ];
  },
};

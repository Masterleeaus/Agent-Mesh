# customer-portal_v2 — API Contracts

## Dashboard

### GET /dashboard
Returns customer dashboard summary.

**Response**: `HomeDashboardResponse`
```typescript
{
  customerName: string;
  healthScore: number;
  healthStatus: HealthStatus;
  openTicketsCount: number;
  upcomingAppointment: UpcomingAppointmentVM | null;
  recentActivity: ActivityVM[];
  unreadNotifications: number;
  activeAppointments: number;
}
```

### GET /customer/satisfaction
Returns customer satisfaction summary.

**Response**: `CustomerSatisfactionResponse`
```typescript
{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}
```

## Tickets

### GET /tickets?page=1&pageSize=10
List customer's tickets.

**Response**: `TicketListResponse`
```typescript
{ tickets: TicketDTO[]; total: number; page: number; pageSize: number; }
```

### GET /tickets/:id
Get ticket detail.

**Response**: `TicketDetailResponse`
```typescript
{ ticket: TicketDTO; messages: MessageDTO[]; }
```

### POST /tickets
Create a new ticket.

**Body**: `CreateTicketRequest`
```typescript
{ subject: string; message: string; requestType: RequestType; channel: Channel; phone: string; email: string; }
```
**Response**: `TicketDTO`

### PUT /tickets/:id/message
Add a message to a ticket.

**Body**: `UpdateTicketRequest`
```typescript
{ ticketId: string; message: string; }
```
**Response**: `TicketDTO`

## Appointments

### GET /appointments?page=1&pageSize=10
List customer's appointments.

**Response**: `AppointmentListResponse`
```typescript
{ appointments: AppointmentDTO[]; total: number; page: number; pageSize: number; }
```

### GET /appointments/:id
Get appointment detail.

**Response**: `AppointmentDTO`

### POST /appointments/book
Book a new appointment.

**Body**: `BookAppointmentRequest`
```typescript
{ serviceType: string; date: string; timeSlot: string; }
```
**Response**: `AppointmentDTO`

### PUT /appointments/:id/reschedule
Reschedule an appointment.

**Body**: `RescheduleRequest`
```typescript
{ appointmentId: string; newDate: string; newTimeSlot: string; reason?: string; }
```
**Response**: `AppointmentDTO`

### DELETE /appointments/:id
Cancel an appointment.

**Body**: `CancelAppointmentRequest`
```typescript
{ appointmentId: string; reason: string; }
```
**Response**: `void`

### GET /appointments/available-slots?date=2026-07-15
Get available time slots for a date.

**Response**: `AvailableSlotsResponse`
```typescript
{ date: string; slots: string[]; }
```

### GET /appointments/calendar?year=2026&month=6
Get calendar appointments for a month.

**Response**: `AppointmentCalendarResponse`
```typescript
{ weeks: AppointmentCalendarVM[][]; }
```

## Invoices

### GET /invoices?page=1&pageSize=10
List invoices.

**Response**: `InvoiceListResponse`
```typescript
{ invoices: InvoiceListItemVM[]; total: number; page: number; pageSize: number; }
```

### GET /invoices/:id
Get invoice detail.

**Response**: `InvoiceDetailResponse`
```typescript
{ invoice: InvoiceDTO; }
```

## Payments

### POST /payments
Make a payment.

**Body**: `MakePaymentRequest`
```typescript
{ invoiceId: string; amount: number; method: string; }
```
**Response**: `PaymentDTO`

### GET /payments?page=1&pageSize=10
List payment history.

**Response**: `PaymentListResponse`
```typescript
{ payments: PaymentListItemVM[]; total: number; page: number; pageSize: number; }
```

## Messages

### GET /messages?page=1&pageSize=20
List all messages.

**Response**: `MessageListResponse`
```typescript
{ messages: MessageListItemVM[]; total: number; page: number; pageSize: number; }
```

### GET /tickets/:id/messages
Get messages for a ticket.

**Response**: `MessageThreadResponse`
```typescript
{ messages: MessageDTO[]; }
```

### POST /tickets/:id/messages
Send a message on a ticket.

**Body**: `SendMessageRequest`
```typescript
{ ticketId: string; body: string; }
```
**Response**: `MessageDTO`

## Notifications

### GET /notifications?page=1&pageSize=20
List notifications.

**Response**: `NotificationListResponse`
```typescript
{ notifications: NotificationListItemVM[]; total: number; page: number; pageSize: number; unreadCount: number; }
```

### PUT /notifications/:id/read
Mark notification as read.

**Response**: `void`

### PUT /notifications/read-all
Mark all notifications as read.

**Response**: `void`

## Feedback

### GET /feedback?page=1&pageSize=10
List feedback history.

**Response**: `FeedbackListResponse`
```typescript
{ feedback: FeedbackListItemVM[]; total: number; page: number; pageSize: number; }
```

### POST /feedback
Submit feedback.

**Body**: `SubmitFeedbackRequest`
```typescript
{ category: FeedbackCategory; rating: number; comment: string; relatedAppointmentId?: string; relatedTicketId?: string; }
```
**Response**: `FeedbackDTO`

## Knowledge Base

### GET /knowledge-base?query=&page=1
Search knowledge base articles.

**Response**: `KnowledgeBaseSearchResponse`
```typescript
{ articles: KnowledgeBaseListItemVM[]; total: number; }
```

### GET /knowledge-base/:id
Get article detail.

**Response**: `KnowledgeBaseArticleResponse`
```typescript
{ article: KnowledgeBaseArticleDTO; }
```

### POST /knowledge-base/:id/helpful
Mark article as helpful/not helpful.

**Body**: `{ helpful: boolean; }`
**Response**: `void`

## Downloads

### GET /downloads?page=1&pageSize=10
List downloadable files.

**Response**: `DownloadListResponse`
```typescript
{ downloads: DownloadListItemVM[]; total: number; }
```

## Service History

### GET /service-history?page=1&pageSize=10
List past service records.

**Response**: `ServiceHistoryResponse`
```typescript
{ services: ServiceHistoryListItemVM[]; total: number; page: number; pageSize: number; }
```

## Technician Tracking

### GET /appointments/:id/tracking
Get technician live tracking data.

**Response**: `TechnicianTrackingResponse`
```typescript
{ tracking: TechnicianTrackingVM | null; }
```

## Profile & Security

### GET /profile
Get customer profile.

**Response**: `ProfileResponse`
```typescript
{ profile: ProfileVM; preferences: NotificationPreferenceDTO; }
```

### PUT /profile
Update profile.

**Body**: `UpdateProfileRequest`
**Response**: `ProfileVM`

### PUT /profile/password
Change password.

**Body**: `ChangePasswordRequest`
```typescript
{ currentPassword: string; newPassword: string; confirmPassword: string; }
```
**Response**: `void`

### GET /profile/notification-preferences
Get notification preferences.

**Response**: `NotificationPreferenceDTO`

### PUT /profile/notification-preferences
Update notification preferences.

**Response**: `NotificationPreferenceDTO`

### GET /security
Get security settings.

**Response**: `SecuritySettingsResponse`
```typescript
{ settings: SecuritySettingDTO; }
```

### PUT /security/two-factor
Toggle two-factor authentication.

**Body**: `EnableTwoFactorRequest`
```typescript
{ enable: boolean; phone: string; }
```
**Response**: `void`

### DELETE /security/sessions/:id
Revoke a session.

**Response**: `void`

## Account Health

### GET /account/health
Get account health data.

**Response**: `AccountHealthResponse`
```typescript
{ account: AccountDTO; health: AccountHealthVM; followups: FollowupDTO[]; }
```

## Help Center

### GET /help/faqs
Get FAQ list.

**Response**: `{ faqs: { question: string; answer: string; category: string }[] }`

## Error Contract

All endpoints return errors in this format on failure:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

HTTP Status codes:
- 200: Success
- 201: Created
- 400: Validation Error (details contains field-level errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Workflow Triggers

| Event | Trigger | Subscribers |
|-------|---------|-------------|
| `ticket.created.customer` | CreateTicket | Support Center, Notifications |
| `ticket.message.sent.customer` | SendMessage | Support Center, Notifications |
| `appointment.requested` | BookAppointment | Appointment Center, Notifications |
| `appointment.rescheduled.customer` | Reschedule | Appointment Center, Notifications |
| `appointment.cancelled.customer` | CancelAppointment | Appointment Center, Notifications |
| `payment.made.customer` | MakePayment | Invoicing, Notifications |
| `feedback.submitted.customer` | SubmitFeedback | CRM Center |
| `profile.updated.customer` | UpdateProfile | CRM Center |
| `password.changed.customer` | ChangePassword | Security Audit |
| `two_factor.toggled.customer` | Toggle2FA | Security Audit |

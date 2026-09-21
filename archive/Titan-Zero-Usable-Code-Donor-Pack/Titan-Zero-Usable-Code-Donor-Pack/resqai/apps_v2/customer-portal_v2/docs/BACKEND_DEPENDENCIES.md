# customer-portal_v2 — Backend Dependencies

## Required Backend Services

| Service              | Purpose                                    | Integration Method |
|----------------------|--------------------------------------------|-------------------|
| Customer Service     | Customer profile, account health           | REST API          |
| Ticket Service       | Support ticket CRUD, messages              | REST API + Events |
| Appointment Service  | Appointment scheduling, tracking           | REST API + Events |
| Invoice Service      | Invoice generation, payment processing     | REST API          |
| Payment Gateway      | Payment processing (credit card, bank)    | REST API          |
| Notification Service | Push/in-app/email notifications            | REST API + Events |
| Knowledge Base API   | Article search, feedback                   | REST API          |
| File Service         | Downloadable files, invoice PDFs           | REST API          |
| Technician Tracking  | Live GPS tracking, ETA calculation         | WebSocket + REST  |
| Auth Service         | Authentication, sessions, 2FA              | lemma-sdk         |

## Database Tables Required

### Customers
| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | UUID     | Primary key             |
| first_name  | string   |                          |
| last_name   | string   |                          |
| email       | string   | Unique                   |
| phone       | string   |                          |
| address     | text     |                          |
| password_hash| string  |                          |
| created_at  | timestamp |                         |
| updated_at  | timestamp |                         |

### Tickets
| Column        | Type       | Notes                    |
|---------------|------------|--------------------------|
| id            | UUID       | Primary key             |
| customer_id   | UUID       | FK → customers          |
| subject       | string     |                          |
| message       | text       |                          |
| status        | enum       | open, in_progress, etc.  |
| request_type  | enum       | support, billing, etc.   |
| channel       | enum       | email, phone, chat, etc. |
| priority      | string     |                          |
| assigned_to   | UUID|null  | FK → agents              |
| created_at    | timestamp  |                          |
| updated_at    | timestamp  |                          |
| resolved_at   | timestamp  |                          |

### Ticket Messages
| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | UUID     | Primary key             |
| ticket_id   | UUID     | FK → tickets             |
| body        | text     |                          |
| direction   | enum     | inbound, outbound        |
| sender_name | string   |                          |
| created_at  | timestamp |                         |
| read_at     | timestamp |                         |

### Appointments
| Column          | Type       | Notes                   |
|-----------------|------------|-------------------------|
| id              | UUID       | Primary key            |
| customer_id     | UUID       | FK → customers         |
| service_type    | string     |                         |
| status          | enum       | scheduled, confirmed, etc.|
| scheduled_date  | date       |                         |
| scheduled_time  | time       |                         |
| technician_id   | UUID|null  | FK → technicians        |
| notes           | text|null  |                         |
| address         | text       |                         |
| estimated_duration| integer  | minutes                 |
| created_at      | timestamp  |                         |
| updated_at      | timestamp  |                         |

### Invoices
| Column        | Type       | Notes                   |
|---------------|------------|-------------------------|
| id            | UUID       | Primary key            |
| customer_id   | UUID       | FK → customers         |
| invoice_number| string     | Unique                  |
| amount        | decimal    |                         |
| paid_amount   | decimal    |                         |
| status        | enum       | pending, paid, overdue, etc.|
| issued_date   | date       |                         |
| due_date      | date       |                         |
| paid_date     | date|null  |                         |
| appointment_id| UUID|null  | FK → appointments       |

### Invoice Line Items
| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | UUID     | Primary key             |
| invoice_id  | UUID     | FK → invoices            |
| description | string   |                          |
| quantity    | integer  |                          |
| unit_price  | decimal  |                          |
| total       | decimal  |                          |

### Payments
| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | UUID     | Primary key             |
| invoice_id  | UUID     | FK → invoices            |
| amount      | decimal  |                          |
| method      | string   | credit_card, bank_transfer, etc.|
| status      | enum     | pending, paid, refunded  |
| paid_at     | timestamp |                         |
| receipt_url | string   |                          |

### Notifications
| Column      | Type     | Notes                    |
|-------------|----------|--------------------------|
| id          | UUID     | Primary key             |
| customer_id | UUID     | FK → customers           |
| title       | string   |                          |
| message     | text     |                          |
| type        | enum     | ticket, appointment, billing, system|
| read        | boolean  | default false            |
| link        | string   | deep link                |
| created_at  | timestamp |                         |

### Notification Preferences
| Column                 | Type    | Notes               |
|------------------------|---------|---------------------|
| customer_id            | UUID    | PK, FK → customers  |
| email                  | boolean |                      |
| sms                    | boolean |                      |
| in_app                 | boolean |                      |
| ticket_updates         | boolean |                      |
| appointment_reminders  | boolean |                      |
| promotional            | boolean |                      |

### Feedback
| Column              | Type       | Notes                |
|---------------------|------------|----------------------|
| id                  | UUID       | Primary key         |
| customer_id         | UUID       | FK → customers       |
| category            | enum       | service, technician, etc.|
| rating              | integer    | 1-5                  |
| comment             | text       |                      |
| appointment_id      | UUID|null  | FK → appointments    |
| ticket_id           | UUID|null  | FK → tickets         |
| created_at          | timestamp  |                      |

### Knowledge Base Articles
| Column          | Type     | Notes                    |
|-----------------|----------|--------------------------|
| id              | UUID     | Primary key             |
| title           | string   |                          |
| summary         | text     |                          |
| content         | text     |                          |
| category        | string   |                          |
| tags            | string[] |                          |
| helpful_count   | integer  |                          |
| not_helpful_count| integer |                          |
| updated_at      | timestamp |                         |

### Service History (view on appointments)
Materialized or queried from Appointments table where status = completed.

### Technician Tracking (real-time)
| Column           | Type       | Notes                 |
|------------------|------------|-----------------------|
| appointment_id   | UUID       | PK, FK → appointments |
| technician_id    | UUID       | FK → technicians       |
| status           | enum       | en_route, on_site, etc.|
| latitude         | decimal    |                       |
| longitude        | decimal    |                       |
| eta_minutes      | integer    |                       |
| last_updated     | timestamp  |                       |

## AI Agent Integration Points

| Agent            | Trigger                          | Response                         |
|------------------|----------------------------------|----------------------------------|
| Ticket Classifier| On ticket created                | Suggests category, priority      |
| Appointment Optimizer| On appointment requested     | Suggests optimal time slots      |
| FAQ Bot          | On knowledge base search         | Returns relevant articles         |
| Notification Agent| On state changes                | Generates notification messages   |

## Function Call Points

| Function                     | Called From               | Purpose                        |
|------------------------------|---------------------------|--------------------------------|
| `create_ticket`              | CreateTicketForm          | Persist new ticket             |
| `add_ticket_message`         | UpdateTicketForm          | Add message to ticket          |
| `book_appointment`           | SelfServiceBooking        | Create appointment             |
| `reschedule_appointment`     | RescheduleAppointmentForm | Update appointment time        |
| `cancel_appointment`         | CancelAppointmentForm     | Cancel appointment             |
| `process_payment`            | InvoiceDetailPage         | Process payment                |
| `submit_feedback`            | SubmitFeedbackForm        | Save feedback                  |
| `update_profile`             | UpdateProfileForm         | Update customer profile        |
| `change_password`            | ChangePasswordForm        | Update password hash           |
| `send_notification`          | Various events            | Deliver notifications          |
| `get_technician_location`    | TrackTechnicianPage       | Get live GPS coordinates       |

## Workflow Trigger Points

| Workflow                     | Trigger Event                  |
|------------------------------|--------------------------------|
| Ticket Assignment            | ticket.created.customer        |
| Appointment Confirmation     | appointment.requested          |
| Appointment Reminder         | 24h before appointment         |
| Overdue Invoice Reminder     | invoice due date passed        |
| Feedback Follow-up           | 24h after appointment complete |
| Technician Assignment        | appointment.requested          |
| Session Timeout Warning      | 5 min before idle timeout      |

## Event Points

| Event                        | Producer               | Consumers                       |
|------------------------------|------------------------|---------------------------------|
| `ticket.created.customer`    | Customer Portal        | Support Center, Notifications   |
| `appointment.requested`      | Customer Portal        | Appointment Center, Scheduling  |
| `appointment.rescheduled`    | Customer Portal        | Appointment Center, Technician  |
| `appointment.cancelled`      | Customer Portal        | Appointment Center, Technician  |
| `payment.made`               | Customer Portal        | Invoice Service, Notifications  |
| `feedback.submitted`         | Customer Portal        | CRM, Analytics                  |
| `profile.updated`            | Customer Portal        | CRM Center                      |

## Mock Implementation Status

All service methods currently use mock data with simulated delays. The mock service layer (`customer-service.ts`) implements the full API contract surface area. Every method:
- Returns realistic mock data matching production types
- Simulates network delay (200-500ms)
- Handles errors with typed error messages
- Supports CRUD operations for all entities

## Integration Checklist

- [ ] Customer Service API
- [ ] Ticket Service API
- [ ] Appointment Service API
- [ ] Invoice Service API
- [ ] Payment Gateway Integration
- [ ] Notification Service
- [ ] Knowledge Base API
- [ ] File Service
- [ ] Technician Tracking Service (WebSocket)
- [ ] Auth Service (lemma-sdk)
- [ ] Event Bus integration (all events)
- [ ] Workflow triggers (all workflows)

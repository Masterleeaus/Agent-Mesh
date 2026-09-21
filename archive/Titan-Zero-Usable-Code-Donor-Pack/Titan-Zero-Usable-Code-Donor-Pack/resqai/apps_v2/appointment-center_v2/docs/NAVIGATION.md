# Navigation

## Route Table
| Route | Page Component | Description |
|-------|---------------|-------------|
| `#/` | DashboardPage | Overview dashboard with metrics and widgets |
| `#/queue` | AppointmentQueuePage | Searchable/filterable appointment list |
| `#/calendar` | CalendarViewPage | Day/week/month calendar grid |
| `#/timeline` | TimelineViewPage | Hourly timeline for selected date |
| `#/appointments/new` | NewAppointmentPage | Multi-step booking wizard |
| `#/appointments/:id` | AppointmentDetailPage | Full appointment view with tabs |
| `#/appointments/:id/reschedule` | ReschedulePage | Reschedule form |
| `#/appointments/:id/assign` | AssignTechnicianPage | Technician assignment |
| `#/history` | AppointmentHistoryPage | Activity log with filters |
| `#/cancelled` | CancelledAppointmentsPage | Cancelled appointment list |
| `#/completed` | CompletedAppointmentsPage | Completed appointment list |
| `#/search` | SearchPage | Global search |
| `#/reports` | ReportsPage | Analytics dashboard |
| `#/technicians` | TechnicianSchedulePage | All technician schedules |
| `#/technicians/:id/schedule` | TechnicianSchedulePage | Single tech schedule |
| `#/services` | ServiceTypesPage | Service type CRUD |
| `#/settings` | ScheduleSettingsPage | Scheduling rules |

## Sidebar Structure
| Item | Route | Icon |
|------|-------|------|
| Dashboard | `#/` | Grid |
| Queue | `#/queue` | List |
| Calendar | `#/calendar` | Calendar |
| Timeline | `#/timeline` | Clock |
| New Appointment | `#/appointments/new` | Plus |
| History | `#/history` | Clock |
| Cancelled | `#/cancelled` | X |
| Completed | `#/completed` | Check |
| Search | `#/search` | Search |
| Reports | `#/reports` | Bar Chart |
| Technicians | `#/technicians` | Users |
| Service Types | `#/services` | Activity |
| Settings | `#/settings` | Settings |

## Breadcrumb Patterns
- Dashboard > Appointment Detail > Reschedule
- Dashboard > Appointment Detail > Assign Technician
- Dashboard > Queue > Appointment Detail
- Dashboard > Calendar > Appointment Detail
- Dashboard > Technicians > Technician Schedule
- Dashboard > Reports

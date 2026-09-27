# Four PWA Surfaces

## Titan Hub (`customer`)
Online-first customer PWA. Primary navigation: Home, Bookings, Chat, Account. CRM read models cover services, bookings/work orders, quotes, invoices and business locations/hours. Offline presentation is a safe shell/cached non-sensitive display only unless the runtime explicitly implements more.

## Titan Go (`field`)
Offline-first field PWA. Primary navigation: Today, Jobs, Titan, More. Builder presents assigned work, customer/site minimum context, tasks, evidence/media/form/signature/incident affordances and sync/conflict state. Titan Go owns the offline DB, media queue and conflict resolution.

## Titan Command (`owner`)
Online-first mobile command centre with read-only cached snapshot support. Primary navigation: Home, Operations, Customers, Titan, with approvals/jobs/team/money/messages/alerts/settings beneath it. High-impact writes are unavailable offline.

## Titan Onboarding (`onboarding`)
Online-first conversation/provisioning surface. It renders Interaction Engine questions and Builder previews; external integrations and provisioning require connectivity. Builder may theme Onboarding after the brand is collected.

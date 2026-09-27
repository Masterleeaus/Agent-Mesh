# Titan Hub Ownership

Hub owns customer-facing application presentation, navigation, customer-safe projection consumption and intent entry points.

Hub does **not** own CRM, Field, Bookings, invoices, payment execution, messaging delivery, authorization or platform governance truth. Provider contributors execute reads/actions under their own authority and return bounded customer-safe projections/receipts.

## Canonical company boundary
`company_id` is the sole tenant/company isolation boundary. Legacy tenant identifiers may be read only as compatibility inputs and must resolve to `company_id`; they never establish independent authority.

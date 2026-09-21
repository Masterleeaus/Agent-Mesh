# TASK-124: Portable vehicle records + field vehicle assignment

**Roadmap:** Phase 1 — Operations Engine Completion  
**Status:** In progress  
**Owner:** Titan Zero Builder 2 continuation lane

## Objective

Keep the existing `vehicles` / `vehicle_sessions` / vehicle cost-of-ownership model as the vehicle source of truth, make the primary vehicle record/capture paths database-portable, and add a durable account-scoped technician-to-vehicle assignment history for dispatch/field operations.

## Constraints

- Do not create a parallel fleet or identity system.
- `business_memberships` / `users` remain workforce identity; `vehicles` remains vehicle identity.
- Assignment changes are owner/admin controlled and tenant scoped.
- A technician has at most one current assigned motor vehicle. History is closed, not deleted.
- Trailers cannot be primary technician vehicles.
- PostgreSQL and MySQL/MariaDB must share the same application SQL path.

## Acceptance criteria

- Vehicle list/create/update and cost/capture paths use the portable DB adapter with explicit `account_id` predicates.
- Fuel/service capture uses app-generated IDs rather than `RETURNING`.
- MySQL/MariaDB has parity schema for vehicle cost records and technician vehicle assignments.
- Owner/admin can assign/unassign a current vehicle for an active business member.
- Dispatch capacity data exposes each technician's current assigned vehicle.
- Assignment writes serialize through the membership row and preserve assignment history.
- Focused tests cover vehicle assignment validation/state transitions where runnable.

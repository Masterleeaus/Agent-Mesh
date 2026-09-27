# Titan Business Workflows — Pass 01

## Purpose

Reconcile the retained Titan Interaction Engine business workflow definitions with the current canonical domain owners on the live Manager Merge60 lineage. This pass does not introduce a replacement workflow engine.

## Ownership rule

Workflow definitions and `workforce-native/workflow.ts` are orchestration/routing layers. They may gather input, plan steps, carry correlation/idempotency metadata, and request governed execution. They do not own CRM, booking, job/work-order, invoice, or payment truth and may not bypass the canonical domain authorization/API surface.

`company_id` remains the only company boundary. Workflow identity does not grant execution authority.

## Reconciled workflows

- New Customer → Titan CRM → `/api/v1/clients`
- Create Quote → Titan CRM → `/api/v1/estimates`
- Service Booking → CRM revenue journey + Bookings/Quotes lifecycle → booking-request lifecycle routes
- Create Job → Titan Field → work-order / estimate-to-job domain routes
- Complete Job → Titan Field → work-order completion route
- Job Variation Approval → Titan Field → work-order update domain route
- Create Invoice → Titan CRM revenue document authority → invoice route
- Payment Reconciliation → CRM receivable/payment lifecycle → invoice payment/payment routes

## Merge60 reconciliation

The packet task semantics were issued against Manager Merge52. Implementation was performed against the live Manager Merge60 canonical. Merge60's newer workforce/offline/live-lane semantics are preserved; this pass adds ownership metadata, a web re-export, focused tests, and documentation only in the packet's exclusive workflow-owned paths.

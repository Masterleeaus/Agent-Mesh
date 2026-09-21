# Titan Zero Usable Code Donor Pack

Curated from the two supplied repositories. This is a donor pack, not a drop-in Titan Zero replacement.

## field-services-os
Reusable operational/business-system implementation including:
- CRM, leads, prospects, customers and activity
- Jobs, scheduling and field workflows
- Estimates, line items, signatures, change orders and conversion to jobs
- Inspections, photos, document packets and PDFs
- Invoices, payments, expenses, mileage, cashflow, P&L and tax
- Subcontractors, reviews, notifications and outreach
- SMS, inbound/outbound calling, IVR and call-centre workflows
- AI chat, personalized outreach and TTS routes
- Webhooks/integration adapters (Stripe, Plaid, Twilio, Sinch, Retell, Calendly, etc.)
- Vertical-specific roofing/storm/EagleView code retained as optional donor code because its workflow and integration patterns can be generalized.

## fieldops-ai
Reusable intelligence/governance implementation including:
- AgentOps control tower, versions, evaluations, deployments and incidents
- Append-only audit patterns
- Recovery plans and governed lifecycle transitions
- Constraint-aware dispatch optimizer with scoring and decision evidence
- Diagnostic copilot workflows and outcomes
- Demand/capacity forecasting and scenarios
- Benchmark/evaluation framework
- APIs, stores, schemas, migrations and tests supporting the above

## Important integration notes for Titan Zero
- Normalize all tenancy to Titan Zero's canonical `company_id` before adopting code.
- Map AgentOps concepts into Titan Workforce / Governance / Assurance rather than creating a parallel control plane.
- Map optimizer outputs into Titan Decision Engine / DecisionPacket contracts.
- Map audit/compensating-action patterns into Assurance / Rewind.
- Map forecasting into Signal / predictive autonomy.
- External provider adapters should remain optional and provider-agnostic; Titan Zero's BYO-key/device-first model remains authoritative.
- Do not copy authentication, tenancy, provider secrets, branding or environment assumptions blindly.

## Excluded
- dependency directories (`node_modules`, `vendor`)
- build output
- Git metadata
- environment/secret files
- backup `.bak` files

Original source structure is retained to make later comparison and selective porting easier.

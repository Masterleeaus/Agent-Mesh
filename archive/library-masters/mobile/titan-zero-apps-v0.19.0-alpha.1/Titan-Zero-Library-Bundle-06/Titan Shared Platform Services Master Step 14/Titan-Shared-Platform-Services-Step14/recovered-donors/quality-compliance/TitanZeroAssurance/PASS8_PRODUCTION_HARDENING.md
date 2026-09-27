# Pass 8 — Production Hardening & Final Team Contract

Final planned convergence pass for the Titan Quality & Compliance Team.

## Canonical architecture
- TitanZeroAssurance: assurance kernel, company execution context, authority, audit backbone, orchestration, governed work queue.
- QualityControl: inspections, scoring, reclean, corrective action and verification.
- CustomerFeedback: complaints, reviews, NPS/CSAT and customer resolution.
- TitanTrust: evidence, presence, incidents, sign-off and trust metadata.
- ComplianceIQ: compliance reporting, integrity analysis and corrective compliance findings.
- AuditLog/Auditing: disabled donor descriptors only.

## Production hardening
- GovernedWorkItemRouter now has a concrete company/idempotency-scoped dispatcher.
- QC failure and complaint received/escalated events are connected to the assurance lifecycle.
- ComplianceIQ's report menu points to a real company-scoped reporting surface.
- Missing governed capabilities were registered.
- QualityControl event company identity fails closed.
- Workforce v2 team contract added.
- company_id remains the sole canonical company boundary.

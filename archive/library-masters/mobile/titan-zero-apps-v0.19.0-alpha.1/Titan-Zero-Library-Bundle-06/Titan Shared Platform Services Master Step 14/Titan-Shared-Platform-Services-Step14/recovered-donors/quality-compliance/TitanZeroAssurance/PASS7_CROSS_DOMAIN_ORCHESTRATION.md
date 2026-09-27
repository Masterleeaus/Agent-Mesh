# Pass 7 — Cross-Domain Assurance Orchestration

TitanZeroAssurance now owns the shared assurance lifecycle:

`signal → evidence → finding → audit event → governed corrective work → execution → verified outcome`

QualityControl, CustomerFeedback, TitanTrust and ComplianceIQ expose thin AssuranceBridge adapters into the kernel instead of importing peer-domain entities. The kernel rejects cross-company findings/work, preserves correlation/causation through SignalEnvelope and AuditEvent, and records verified outcomes. Common quality, feedback, trust and compliance signals are normalized by RuleBasedAssuranceHandler.

QualityControl execution record reads/creates were additionally tightened to require a positive company_id rather than allowing nullable company filtering.

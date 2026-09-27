# Pass 6 — ComplianceIQ Convergence

ComplianceIQ is the canonical `compliance_reporting` consumer of Titan Zero Assurance, not an audit owner.

- Reports, annotations and hashes are company_id scoped.
- Reports read the canonical AuditEventStore.
- Integrity records form a previous-hash chain and expose company integrity roots.
- Queued jobs carry explicit CompanyExecutionContext.
- Placeholder tamper/anomaly logic is removed.
- Integrity exceptions become AssuranceFinding + governed compliance corrective WorkItemRequest.
- Compliance capabilities are registered in TitanZeroAssurance.
- No tenant_company_id is introduced.

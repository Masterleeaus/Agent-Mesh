# Issue #724 — FieldServicePro convergence matrix

Donor: `archive/Titan-Zero-Usable-Code-Donor-Pack/Titan-Zero-Usable-Code-Donor-Pack/fieldservicepro`

Rule: Titan Zero remains authoritative. Donor code does not create a parallel runtime, database authority, authentication system, tenant boundary, scheduler, or execution authority.

| Donor capability | Titan canonical owner/baseline | #724 disposition |
|---|---|---|
| Jobs/work orders/visits | Titan Field / existing web + domain lifecycle | Retain Titan; donor runtime rejected |
| Dispatch/assignment | Titan Workforce + Field | Retain Titan; donor authority rejected |
| SLA | Titan workforce-capacity SLA | Retain canonical prioritisation; imported bounded business-hours calendar only |
| Recurring maintenance | worker recurring-work + governed rebooking lifecycle | Retain engine; imported preferences: seasonality, preferred day/time, pause-until, advance window, parts/checklist refs |
| Certifications | shared workforce qualification owner / licensed trades | Retain authority; imported credential expiry/reminder + job requirement semantics |
| Permits/inspections | Titan Field completion lifecycle | Imported bounded permit/inspection contracts, governed persistence/API and completion blockers |
| Punch lists/defects | Titan Field completion/evidence | Imported defect verification semantics and completion blockers; critical deferral remains blocking |
| Warranty/claims | no equivalent domain found | Imported bounded warranty/claim contracts; no invoice/job authority; related job/work-order ownership must be validated at a persistence/orchestration boundary before future runtime use |
| RFI | project/work-order/change-order/communications authorities | Imported bounded RFI contract; change order remains recommendation/reference only; company-scoped project/work-order/change-order references require authoritative boundary validation before future persistence |
| Submittals | project/document/evidence authorities | Imported bounded review/revision contract; document refs only; project/work-order/revision lineage requires authoritative boundary validation before future persistence |
| Change orders | existing canonical change-order implementation | Retain Titan; donor implementation rejected |
| Portal/auth/users | existing Titan auth/surfaces | Donor rejected |
| AI/chat provider | Titan AI Core/provider registry | Donor rejected |
| Reports | projection-only reporting | Donor runtime rejected; existing projections remain canonical |
| Flask/SQLAlchemy runtime | TypeScript Titan Zero | Rejected |
| organization/account/tenant donor boundaries | company_id | Rejected; canonical contracts fail closed on legacy aliases |

## Verification still required before donor deletion

1. Run titan-platform typecheck/test and web typecheck/tests.
2. Fix any compile/runtime failures from #724.
3. Verify migration 190/191 against current database/RLS conventions.
4. Verify API route tests and transaction rollback behaviour.
5. Confirm no remaining donor capability is superior and genuinely missing.
6. Warranty/RFI/submittal remain contract-only in #724. Do not add persistence/API merely to wire reference validation; when a canonical runtime boundary is introduced, it must call the exported company-scoped reference guard using ownership resolved by that authority.
7. Only then delete the consumed FieldServicePro donor tree and close #724.

## Governance invariants

- `company_id` is the only canonical tenant boundary.
- Intelligence, recommendations, approvals in imported contracts, or recurrence calculations never confer execution authority.
- Work-order completion remains owned by the existing canonical lifecycle.
- Permit/inspection/defect records contribute bounded blockers; they do not own work-order state.
- Existing Titan systems are retained whenever an equivalent authority already exists.


## Cross-record reference decision

The repository scan found no canonical #724 persistence/orchestration boundary for warranty, RFI, or submittal records. Their related IDs are therefore descriptive references only in this issue. The shared `business-reference-integrity` guard is intentionally not called from the pure builders because a caller-supplied `company_id` beside an ID is not evidence of ownership. Future persistence must resolve each related record through its canonical owner, construct company-scoped references from that authoritative result, and fail closed before storage or execution. This avoids creating a duplicate project/job/change-order authority solely for donor convergence.


## Deletion-readiness audit — 2026-09-22

A final donor-path lookup on `agent/724` no longer resolves the previously scanned FieldServicePro model files (warranty, permit, RFI, submittal, punch-list, recurring-schedule), and repository code search returns no FieldServicePro donor implementation hits. This means the branch must not attempt a blind delete: the donor tree is already absent or moved relative to the earlier scan. Treat donor deletion as satisfied only after confirming branch/tree state at merge time; do not fabricate a delete commit.

The capability comparison remains frozen above: canonical Titan owners were retained for work orders, dispatch, SLA, recurring execution, qualification authority, change orders, auth, AI/chat, reporting and tenancy. The bounded semantics imported under #724 are warranty/claims, permit/inspection completion evidence, defect verification, RFI, submittal review/revision, qualification credential expiry, recurring preferences and business-hours SLA calculation. No newly identified donor runtime authority is required.

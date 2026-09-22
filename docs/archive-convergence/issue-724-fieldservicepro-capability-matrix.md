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
| Warranty/claims | no equivalent domain found | Imported bounded warranty/claim contracts; no invoice/job authority |
| RFI | project/work-order/change-order/communications authorities | Imported bounded RFI contract; change order remains recommendation/reference only |
| Submittals | project/document/evidence authorities | Imported bounded review/revision contract; document refs only |
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
6. Only then delete the consumed FieldServicePro donor tree and close #724.

## Governance invariants

- `company_id` is the only canonical tenant boundary.
- Intelligence, recommendations, approvals in imported contracts, or recurrence calculations never confer execution authority.
- Work-order completion remains owned by the existing canonical lifecycle.
- Permit/inspection/defect records contribute bounded blockers; they do not own work-order state.
- Existing Titan systems are retained whenever an equivalent authority already exists.

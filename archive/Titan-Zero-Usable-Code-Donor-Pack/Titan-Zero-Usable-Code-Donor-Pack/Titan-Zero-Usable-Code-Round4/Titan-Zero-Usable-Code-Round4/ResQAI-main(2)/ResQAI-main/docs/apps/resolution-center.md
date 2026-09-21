# Resolution Center

## Purpose

Service disputes management tool. Enables human operators to review, analyze, and resolve customer disputes with AI-generated recommendations from the `resolution-advisor` agent.

## Current Status

✅ Build-ready — passes `tsc --noEmit` and `vite build`
✅ Validated against Lemma pod data
❌ No unit tests
⚠️ Requires Lemma SDK authentication (blocked on auth redirect fix)

## Tables Used

| Table | Usage |
|-------|-------|
| `disputes` | Core table — customer claims, provider claims, evidence, AI recommendation, status |
| `appointments` | Joined to resolve customer_id and service_type for display |
| `customers` | Joined via appointment; updated on approval to reflect dispute impact |
| `operations_log` | Audit trail for all actions |

## Agents Used

| Agent | Trigger | Purpose |
|-------|---------|---------|
| `resolution-advisor` | "Analyze (AI)" button on open disputes | Analyzes dispute by ID, produces recommended_resolution, confidence, reasoning |

## Functions Used

None.

## State Machine

```
open ──> analyzing ──> recommendation_ready ──> approved ──> closed
                                            ──> rejected ──> (closed)
```

## Resolution Types

| Enum | Display |
|------|---------|
| `full_refund` | Full refund |
| `partial_refund` | Partial refund |
| `redo_service` | Redo service |
| `discount_credit` | Discount credit |
| `no_action` | No action |
| `escalate_legal` | Escalate legal |

## KPI Definitions

- **Awaiting approval** — status = `recommendation_ready` or `analyzing`
- **Total open** — status = `open`, `analyzing`, or `recommendation_ready`
- **Resolved** — status = `approved` or `closed`

## Customer Impact on Approval

- `full_refund` / `partial_refund` → customer status = `in_dispute`
- `no_action` → customer status = `active`
- `escalate_legal` → customer status = `in_dispute`

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `KpiCards` | 3 KPI metric cards (awaiting approval, total open, resolved) |
| `DisputeList` | Sortable dispute table with status badges |
| `EvidencePanel` | 3-column evidence grid (customer claim, provider claim, evidence) |
| `RecommendationCard` | AI recommendation with confidence bar |
| `DisputeDetail` | Full detail panel with action buttons |

## Known Limitations

- No evidence file upload (text summaries only)
- No arbitration workflow for complex disputes
- No customer communication portal
- No dispute analytics or trends reporting

## Future Improvements

- File/photo evidence upload
- Multi-party arbitration workflow
- Customer communication portal
- Dispute analytics dashboard (trends, resolution rates, agent performance)
- Automated escalation to management
- Integration with refund/credit processing systems

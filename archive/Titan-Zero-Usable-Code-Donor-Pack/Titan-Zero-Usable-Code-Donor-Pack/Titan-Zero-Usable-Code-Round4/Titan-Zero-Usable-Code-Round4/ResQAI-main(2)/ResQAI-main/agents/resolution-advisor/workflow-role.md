# workflow Role — resolution-advisor

## workflow Placement

Central node in the dispute resolution pipeline. Called when a dispute is ready
for analysis.

## workflow Triggers

1. **Automatic:** `workflow_dispute` graph — DATASTORE trigger when `disputes.status` flips to `under_review`
2. **On-demand:** "Re-analyze" button in the resolution center app

## workflow Input Contract

```json
{
  "dispute_id": "<uuid>",
  "force_reanalysis": false
}
```

## workflow Output Contract

`analysis_status` drives workflow DECISION routing:

| Status | Downstream Action |
|---|---|
| `ready_for_review` | Notify the assigned reviewer |
| `insufficient_evidence` | Pause; ask human investigator for context |
| `safety_escalation` | Notify ops manager immediately |
| `legal_escalation` | Notify legal counsel on parallel branch |
| `already_analyzed` | No-op (idempotent re-run) |
| `blocked` | Escalate to human |

## Upstream Agents

None.

## Downstream

- Human approval FORM (for ready_for_review)
- Ops manager notification (for safety_escalation)
- Legal counsel notification (for legal_escalation)

## Idempotency

Safe to re-run. If dispute is already `recommendation_ready` and `force_reanalysis`
is not true, returns `already_analyzed` with prior results. Refuses to analyze
already finalized disputes (approved/closed).

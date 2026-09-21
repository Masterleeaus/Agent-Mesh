# workflow Role — request-classifier

## workflow Placement

First node in the intake pipeline. Called immediately after a ticket is created
via a FORM or DATASTORE trigger, before any human sees the ticket.

## workflow Triggers

1. **Automatic:** `workflow_intake` graph — FORM or DATASTORE trigger on ticket creation
2. **On-demand:** Manual re-classify action from the support app

## workflow Input Contract

Two valid payload shapes:

### Shape 1 — Preferred (ticket already exists)
```json
{
  "ticket_id": "<uuid>"
}
```

### Shape 2 — Raw inbound (classify before persist)
```json
{
  "message": "...",
  "channel": "email",
  "customer_name": "...",
  "ticket_id": "<uuid to write back>"
}
```

## workflow Output Contract

`classification_status` drives workflow DECISION routing:

| Status | Downstream Action |
|---|---|
| `classified` | Proceed to draft / schedule step (call support-reply-drafter) |
| `needs_human_review` | Pause for a human reviewer |
| `unparseable` | Escalate to intake FORM |

## Downstream Agents

- **support-reply-drafter** — called after classification when status is `classified`

## Idempotency

Safe to re-run. Overwrites classification fields on the same ticket.
No duplicate side effects.

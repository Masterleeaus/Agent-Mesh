# workflow Role — support-reply-drafter

## workflow Placement

Second node in the intake pipeline. Called after `request-classifier` completes.
Also callable on-demand via a "draft next reply" button in the support app.

## workflow Triggers

1. **Automatic:** `workflow_intake` graph — called right after request-classifier finishes
2. **On-demand:** "Draft next reply" button in the support app

## workflow Input Contract

```json
{
  "ticket_id": "<uuid>",
  "override_technician": "<technician name> (optional)"
}
```

## workflow Output Contract

`draft_status` drives workflow DECISION routing:

| Status | Downstream Action |
|---|---|
| `ready_to_send` | Send to human approval FORM |
| `needs_human_call` | Pause, notify ops manager (no available tech) |
| `needs_rewrite` | Re-trigger request-classifier or fix input |
| `blocked` | Escalate to human reviewer |

## Upstream Agents

- **request-classifier** — must run first to set request_type/urgency

## Downstream

- Human approval FORM (for ready_to_send)

## Idempotency

Re-running overwrites draft_reply / suggested_owner. Only re-writes when input
materially changed. Does not re-draft for tickets already in `sent` status.

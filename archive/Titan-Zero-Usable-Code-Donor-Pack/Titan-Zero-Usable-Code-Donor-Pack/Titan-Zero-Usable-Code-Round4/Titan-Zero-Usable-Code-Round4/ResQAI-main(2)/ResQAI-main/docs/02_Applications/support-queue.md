# Support Queue

## Purpose

Urgency-first inbox for triaging and responding to customer support tickets. Operators classify, draft replies, approve, send, and close tickets in a two-column queue interface.

## Current Status

✅ Build-ready — passes `tsc --noEmit` and `vite build`
✅ Has unit tests (9 tests, vitest)
✅ Validated against Lemma pod data
⚠️ Requires Lemma SDK authentication (blocked on auth redirect fix)

## Tables Used

| Table | Usage |
|-------|-------|
| `tickets` | List all tickets; read/write status, urgency, request_type, draft_reply, approved_to_send |
| `operations_log` | Audit trail for every action (classify, draft, approve, sent, close) |

## Agents Used

| Agent | Trigger | Purpose |
|-------|---------|---------|
| `request-classifier` | "Classify (AI)" button on `new` tickets | Analyzes subject/message; returns `request_type`, `urgency`, `suggested_owner` |
| `support-reply-drafter` | "Draft reply (AI)" button on `classified`/`drafted` tickets | Generates professional draft reply based on ticket context |

## Functions Used

None.

## State Machine

```
new ──[Classify]──> classified ──[Draft]──> drafted ──[Approve]──> approved_to_send ──[Mark sent]──> sent
                                                                                                        │
                                                                                                        └──> closed
                                                                                        [Close at any time] ──> closed
```

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `FilterBar` | Filter tabs (open, urgent, new, awaiting_approval, all) |
| `TicketList` | Sorted list of tickets with urgency badges |
| `TicketDetail` | Full ticket view with action buttons |
| `services/ticket-service.ts` | All data access: fetch, update, agent calls, logging |
| `hooks/useTickets.ts` | State management: filter, selection, loading, refresh |

## Known Limitations

- No keyboard shortcuts for high-volume triage
- No bulk operations (classify/draft/approve multiple tickets at once)
- No real-time updates — requires manual refresh
- No email/SMS integration for outbound replies

## Future Improvements

- Keyboard navigation (j/k to move, Enter to select)
- Bulk classify/draft/approve
- webSocket or polling for live updates
- Email/SMS integration for sending replies
- Sentiment analysis on incoming tickets

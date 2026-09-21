# Support Queue

Urgency-first inbox for triaging and responding to customer support tickets.

## Features

- **Filter bar** — All open, Urgent only, New (untriaged), Awaiting approval, All
- **Two-column layout** — Ticket list (left) + detail/action panel (right)
- **Urgency badges** — Color-coded urgency indicators (urgent/high/normal/low)
- **AI Classification** — Classify new tickets via `request-classifier` agent
- **AI Drafting** — Generate draft replies via `support-reply-drafter` agent
- **Approval workflow** — Review and edit draft, then approve to send
- **Audit trail** — All actions logged to `operations_log`

## Tables used

- `tickets` — core ticket data
- `operations_log` — action audit trail

## Agents used

- `request-classifier` — determines request_type, urgency, suggested_owner
- `support-reply-drafter` — generates professional draft replies

## Setup

```bash
npm install
npm run dev
```

The app mounts at e.g. `/support-queue` and expects the Lemma SDK (`LemmaClient`) to be available on `window.LemmaClient`.

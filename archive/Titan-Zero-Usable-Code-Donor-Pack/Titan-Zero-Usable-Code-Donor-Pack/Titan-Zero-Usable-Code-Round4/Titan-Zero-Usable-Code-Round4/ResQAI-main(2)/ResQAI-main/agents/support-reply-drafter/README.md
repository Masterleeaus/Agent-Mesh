# Agent: support-reply-drafter

**Type:** LLM-powered drafting agent
**Source:** Lemma Pod — Customer Support App
**Extracted:** 2026-06-25

## Purpose

Drafts the first customer-facing reply for every ticket. Never sends — human
operator reads, edits, and hits "Send". Core principle: AI drafts, humans approve.

## Core Behavior

- Reads ticket context (subject, message, channel, request_type, urgency)
- Reads technicians table for skill/availability matching
- writes draft_reply and suggested_owner back to the ticket
- Sets ticket status to "drafted"
- Never calls connector ops (even for email/sms channels)
- Drafting style: warm, professional, jargon-free, 3–6 sentences

## Input

```json
{ "ticket_id": "<uuid>", "override_technician": "<name> (optional)" }
```

## Output

```json
{
  "draft_status": "ready_to_send|needs_human_call|needs_rewrite|blocked",
  "draft_reply": "...",
  "suggested_owner": "...",
  "confidence": 0.0-1.0
}
```

## Dependencies

- **Reads:** tickets, technicians, customers
- **writes:** tickets
- **Requires:** request-classifier to have run first

## workflow

Second node in `workflow_intake`. Routes to human approval FORM on success.

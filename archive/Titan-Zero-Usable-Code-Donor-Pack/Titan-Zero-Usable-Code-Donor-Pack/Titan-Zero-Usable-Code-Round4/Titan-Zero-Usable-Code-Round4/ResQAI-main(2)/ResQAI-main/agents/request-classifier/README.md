# Agent: request-classifier

**Type:** LLM-powered classification agent
**Source:** Lemma Pod — Customer Support App
**Extracted:** 2026-06-25

## Purpose

First line of triage. Classifies incoming customer tickets into a request type
and urgency level, and suggests the best technician to handle the issue.

## Core Behavior

- Reads ticket contents (subject, message, channel, customer_name)
- Classifies into: new_booking, reschedule, cancellation, complaint, follow_up, general_inquiry
- Sets urgency: low, normal, high, urgent
- Suggests technician by skill match + availability + rating
- writes classification back to the ticket (status → "classified")
- Never sends messages, never creates appointments, never touches disputes

## Input

```json
{ "ticket_id": "<uuid>" }
// OR
{ "message": "...", "channel": "...", "customer_name": "...", "ticket_id": "<uuid>" }
```

## Output

```json
{
  "classification_status": "classified|needs_human_review|unparseable",
  "request_type": "new_booking|reschedule|cancellation|complaint|follow_up|general_inquiry",
  "urgency": "low|normal|high|urgent",
  "suggested_owner": "<technician name or null>",
  "recommended_next_action": "..."
}
```

## Dependencies

- **Reads:** tickets, technicians
- **writes:** tickets

## workflow

First-class node in `workflow_intake` graph. Called from FORM or DATASTORE trigger
on ticket creation. Routes to support-reply-drafter on success.

# Agent: resolution-advisor

**Type:** LLM-powered dispute resolution agent
**Source:** Lemma Pod — Customer Support App
**Extracted:** 2026-06-25

## Purpose

Mediator for service disputes. Analyzes both sides of a dispute and recommends
a resolution from a fixed enum. Never finalizes — human approves.

## Core Behavior

- Reads customer_claim, provider_claim, evidence_summary from disputes
- Recommends: full_refund, partial_refund, redo_service, discount_credit, no_action, escalate_legal
- Sets confidence 0–1 with honest assessment
- writes recommended_resolution, resolution_reason, confidence to dispute
- Sets dispute status to "recommendation_ready"
- Logs operations_log breadcrumb
- Never finalizes disputes (human must approve/reject)

## Input

```json
{ "dispute_id": "<uuid>", "force_reanalysis": false }
```

## Output

```json
{
  "analysis_status": "ready_for_review|insufficient_evidence|safety_escalation|legal_escalation|already_analyzed|blocked",
  "recommended_resolution": "...",
  "confidence": 0.0-1.0,
  "resolution_reason": "..."
}
```

## Dependencies

- **Reads:** disputes, customers, appointments, tickets, operations_log
- **writes:** disputes, operations_log

## workflow

First-class node in `workflow_dispute`. Triggered by DATASTORE trigger on
disputes.status → under_review. Routes to human approval after analysis.

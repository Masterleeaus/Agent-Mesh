# ResQAI — Agents

## Overview

5 AI agents power the ResQAI platform. Each agent has a specific operational role and follows a consistent configuration structure. All agents are defined in their respective directories under `agents/`.

## Agent Structure

Each agent directory contains:

| File | Purpose |
|------|---------|
| `agent.json` | Agent metadata, model config, name |
| `instruction.md` | System prompt defining the agent's role, behavior, and output format |
| `input-schema.json` | JSON Schema for expected input |
| `output-schema.json` | JSON Schema for expected output |
| `permissions.json` | Table read/write permissions |
| `tool-access.md` | Description of tools the agent can use |
| `workflow-role.md` | How the agent integrates into workflows |
| `README.md` | Human-readable overview |

## Agent Reference

### request-classifier

Classifies inbound support tickets by request type, urgency, and suggested technician.

| Property | Value |
|----------|-------|
| Tables Read | `tickets`, `technicians` |
| Tables written | `tickets` |
| Functions Used | None |
| workflow Role | First node in intake pipeline — triggered on ticket creation |
| Invoked By | Support Queue ("Classify (AI)" button) |

### support-reply-drafter

Generates professional customer-facing draft replies and suggests the best owner by skill match.

| Property | Value |
|----------|-------|
| Tables Read | `tickets`, `technicians`, `customers` |
| Tables written | `tickets` |
| Functions Used | None |
| workflow Role | Second node in intake pipeline — routes to human approval |
| Invoked By | Support Queue ("Draft reply (AI)" button) |

### operations-coordinator

Acts as a "chief of staff" — reads the full operations board and produces a prioritized action list for human review.

| Property | Value |
|----------|-------|
| Tables Read | `tickets`, `appointments`, `technicians`, `customers`, `tasks`, `operations_log` |
| Tables written | `tasks`, `operations_log` |
| Functions Used | None |
| workflow Role | Daily standup / on-demand coordinator |
| Invoked By | Ops Dashboard ("Run Coordinator" button), Appointment Board ("Suggest tech (AI)") |

### resolution-advisor

Analyzes service disputes and recommends a resolution from a fixed enum of options.

| Property | Value |
|----------|-------|
| Tables Read | `disputes`, `customers`, `appointments`, `tickets`, `operations_log` |
| Tables written | `disputes`, `operations_log` |
| Functions Used | None |
| workflow Role | First node in dispute pipeline — triggered on `under_review` status |
| Invoked By | Resolution Center ("Analyze (AI)" button) |

### account-health-monitor

CRM health lead — calls both deterministic Python functions, creates tasks based on findings.

| Property | Value |
|----------|-------|
| Tables Read | `accounts`, `followups`, `customers`, `appointments`, `disputes`, `tasks` |
| Tables written | `tasks`, `operations_log` |
| Functions Used | `account_health_scan`, `flag_slipping_followups` |
| workflow Role | Nightly schedule / on-demand "Run health check" |
| Invoked By | CRM Tracker (health scan panel) |

## Agent Interaction Diagram

```
INTAKE PIPELINE:
  Ticket Created → request-classifier → support-reply-drafter → Human Approval

DISPUTE PIPELINE:
  Dispute (under_review) → resolution-advisor → Human Review & Approval

OPERATIONS LAYER:
  operations-coordinator (on-demand / daily) → Human Review → Actions
  account-health-monitor (nightly / on-demand) → Functions → Tasks

SHARED PRINCIPLES:
  - AI drafts, humans approve (all agents produce recommendations, not final actions)
  - Safe to re-run (agents are stateless and non-destructive)
  - workflow-first (agents designed as workflow nodes)
```

---

## Agent Review Summary

*Derived from `docs/AGENT_REVIEW.md` (archived).*

### Prompt Quality: 8/10
All agents have clear scope boundaries, negative constraints, structured output contracts with workflow status codes, and idempotency sections. `operations-coordinator` and `account-health-monitor` include detailed reasoning guides.

### Key Duplications
- **Technician selection algorithm** (`skill → availability → rating`, urgency override) duplicated in `request-classifier` and `support-reply-drafter`
- **"No outbound messaging"** guardrail repeated in 4/5 agents
- **Status code tables** follow identical pattern across all agents
- **Input schema** duplicated in both `instruction.md` and `input-schema.json` (drift risk)

### Guardrails: 7/10
Hallucination guards are strong (`"Never fabricate a name"`). Missing: rate limiting, PII/content safety filters, confidence thresholds on classification, and caps on task creation per run.

### Weaknesses by Agent
| Agent | Issue |
|-------|-------|
| `request-classifier` | No confidence threshold; `suggested_owner` conflates tech assignment with triage |
| `support-reply-drafter` | No guard against drafting for `sent`/`closed` tickets |
| `resolution-advisor` | `already_analyzed` status conflicts with `force_reanalysis` guard |
| `operations-coordinator` | Capped at 8 recommendations — no overflow guidance |
| `account-health-monitor` | No stale-data guard; no max task cap per run |
```

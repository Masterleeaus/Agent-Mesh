# ResQAI V2 — AI Confidence Policy

## Confidence Architecture

Confidence scoring measures how certain an agent is about its output. It determines whether output can proceed autonomously or requires human review.

```
Agent Output
    │
    ▼
Confidence Assessment (0.0 – 1.0)
    │
    ├── ≥ 0.90 ──── Auto-route to next step
    ├── 0.70–0.89 ── Route to human for quick review
    ├── 0.50–0.69 ── Route to human with escalation note
    └── < 0.50 ──── Block and escalate to senior reviewer
            │
            ▼
    Safety Rule Check
    │
    ├── Safety violation? ──► Immediate escalation (bypass confidence)
    └── No violation ──────► Route per confidence level
```

## Agent Confidence Strategies

### request-classifier

| Confidence Range | Meaning | Routing |
|---|---|---|
| ≥ 0.90 | Clear classification — unambiguous language, matching keywords | Auto-route to workflow next node |
| 0.70–0.89 | Reasonable classification — some ambiguity | Route to support-reply-drafter with flag |
| 0.50–0.69 | Weak signal — one-word message, contradictory signals | Pause for human review |
| < 0.50 | Unparseable — empty/invalid input | Escalate to intake FORM |

**Confidence Factors:**
- Message length (longer → higher confidence)
- Keyword match strength
- Absence of contradictory signals
- Channel clarity

### support-reply-drafter

| Confidence Range | Meaning | Routing |
|---|---|---|
| ≥ 0.90 | Perfect match — unambiguous skill/availability/urgency alignment | Route to approval FORM |
| 0.85–0.89 | Strong match — minor uncertainty in tone or tech selection | Route to approval FORM |
| 0.70–0.84 | Good match — some uncertainty in suggested_owner or draft tone | Route to approval FORM with note |
| < 0.70 | Weak match — poor signal, conflicting data | Flag for human to draft from scratch |

**Confidence Factors:**
- Technician skill/availability match clarity
- Message signal strength
- Channel suitability for drafted tone
- Absence of contradictions

### operations-coordinator

| Confidence Range | Meaning | Routing |
|---|---|---|
| N/A | Output is deterministic — priority ranking based on observed data | No confidence score emitted |
| Special: `coordination_status: "crisis"` | Urgent items detected | Discord alert + red banner |
| Special: `coordination_status: "unavailable_data"` | Required tables returned no rows | Error state, retry |

**Note:** Coordination status replaces confidence for this agent. Output is rule-based, not probabilistic.

### resolution-advisor

| Confidence Range | Meaning | Routing |
|---|---|---|
| ≥ 0.85 | Evidence unambiguously supports this outcome | Route to reviewer approval |
| 0.60–0.84 | Best fit, but reasonable people could disagree | Route to reviewer with alternative options |
| < 0.60 | Weak evidence — lean toward escalate_legal | Require human call before decision |

**Confidence Factors:**
- Evidence completeness (both sides have detail)
- Contradiction presence between claim and evidence
- Resolution type rarity (full_refund naturally lower confidence)
- Dispute monetary value
- Safety/legal indicators (override confidence → immediate escalation)

### account-health-monitor

| Confidence Range | Meaning | Routing |
|---|---|---|
| N/A | Output is deterministic — priority based on health scan + function outputs | No confidence score emitted |
| Special: `coordination_status: "crisis"` | Critical accounts detected | Discord alert |
| Special: `coordination_status: "no_action_needed"` | All accounts healthy | No action required |

**Note:** Coordination status replaces confidence. Output is rule-based from deterministic function outputs.

### tech-suggester

| Confidence Range | Meaning | Routing |
|---|---|---|
| ≥ 0.85 | Clear skill + availability match, light workload | Auto-suggest to dispatch |
| 0.60–0.84 | Matches skill but moderate workload or competing priorities | Route to human for confirmation |
| < 0.60 | Weak match — poor skill fit, heavy load, or no available tech | Flag for human review |

**Confidence Factors:**
- Skill match exactness
- Technician current_load count
- Rating proximity to 5.0
- Scheduling conflict presence
- Availability status

## Confidence Threshold Configuration

| Threshold | Agent | Default | Configurable? | Override By |
|---|---|---|---|---|
| Auto-route | request-classifier | 0.90 | Yes | admin-center_v2 settings |
| Auto-route | tech-suggester | 0.85 | Yes | admin-center_v2 settings |
| Human review | support-reply-drafter | 0.70 | Yes | admin-center_v2 settings |
| Human review | resolution-advisor | 0.60 | Yes | admin-center_v2 settings |
| Escalation | resolution-advisor | 0.50 | Yes | admin-center_v2 settings |
| Safety override | resolution-advisor | Always | No | Hard-coded |
| Urgency override | request-classifier | Always | No | Hard-coded |

## Confidence Override Rules

| Rule | Condition | Action |
|---|---|---|
| Safety override | Safety keywords detected (request-classifier) | Force `urgent` + `needs_human_review` |
| Legal override | >$5k or misconduct (resolution-advisor) | Force `legal_escalation` |
| Evidence override | Insufficient evidence (resolution-advisor) | Force `insufficient_evidence` |
| Idempotent override | Already processed (resolution-advisor, tech-suggester) | Return cached result |
| Data missing override | Required table empty (operations-coordinator) | Force `unavailable_data` |

## Confidence Monitoring

| Metric | Monitoring | Alert Trigger |
|---|---|---|
| Average confidence per agent | Per-execution logged | Sustained drop > 0.10 over 7 days |
| Low-confidence rate | % of outputs < threshold | Rate > 20% over 1 day |
| Human override rate | % of outputs overridden | Rate > 30% over 1 day |
| False confidence | Incorrect high-confidence outputs | Detected via outcome tracking |

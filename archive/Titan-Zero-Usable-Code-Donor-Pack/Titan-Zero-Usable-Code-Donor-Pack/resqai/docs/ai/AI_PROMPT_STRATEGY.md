# ResQAI V2 — AI Prompt Strategy

## Prompt Architecture Overview

Every agent has a dedicated `instruction.md` file that defines its system prompt. These prompts follow a standardized architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT STRUCTURE                    │
├──────────────────────────────────────────────────────────────┤
│  1. IDENTITY & ROLE     — Who the agent is                   │
│  2. CORE BEHAVIOR       — What it does / doesn't do          │
│  3. INPUT CONTRACT      — What it receives                   │
│  4. OUTPUT CONTRACT     — What it produces                   │
│  5. REASONING RULES     — How it thinks                      │
│  6. WORKFLOW CONTRACT   — How it fits in the pipeline        │
│  7. CONNECTOR USE       — External integrations              │
│  8. IDEMPOTENCY RULES   — Re-run safety                      │
│  9. SAFETY BOUNDARIES   — What it must NEVER do              │
└──────────────────────────────────────────────────────────────┘
```

## Prompt Strategy by Agent

### request-classifier

| Strategy Element | Detail |
|---|---|
| **Type** | Zero-shot classification with enumerated output types + decision tree |
| **Instruction Source** | `agents/request-classifier/instruction.md` |
| **Classification Method** | Keyword pattern matching + context understanding |
| **Output Enum** | `new_booking`, `reschedule`, `cancellation`, `complaint`, `follow_up`, `general_inquiry` |
| **Urgency Rules** | Explicit keyword mapping: "sparking" → urgent, "no heat" → urgent, etc. |
| **Ambiguity Rule** | When in doubt between `complaint` and `new_booking`, prefer `complaint` (higher-stakes) |
| **Owner Selection** | skill → availability → rating (tiebreak) → urgency override |
| **No-fabrication Rule** | Set `suggested_owner` to role string if no tech matches; never fabricate name |
| **Anti-pattern** | Never classify as non-urgent when safety keywords present |
| **Evaluation** | Output is deterministic — can be validated against known test cases |

### support-reply-drafter

| Strategy Element | Detail |
|---|---|
| **Type** | Few-shot prompting with explicit tone/style rules |
| **Instruction Source** | `agents/support-reply-drafter/instruction.md` |
| **Tone Rules** | Warm, professional, jargon-free. Never start with "Thank you for reaching out". |
| **Length Rules** | 3–6 sentences. Shorter for urgent, longer for process explanations. |
| **Complaint Handling** | Lead with acknowledgement + ownership. Avoid defensiveness. |
| **Emergency Handling** | Open with safety note, then process. |
| **Channel Awareness** | Email → formal draft. Chat → concise. SMS → brief. |
| **Anti-patterns** | No "as an AI" language. No "based on my analysis". No fabricating names. |
| **Reddit Integration** | Research similar issues before drafting. Reference insights, not Reddit links. |
| **Evaluation** | Subjective quality assessment via approval rate |

### operations-coordinator

| Strategy Element | Detail |
|---|---|
| **Type** | Rule-based decision tree with 6 priority tiers |
| **Instruction Source** | `agents/operations-coordinator/instruction.md` |
| **Priority Order** | 1. Urgent safety → 2. Stuck customers → 3. Imminent appointments → 4. Slipping relationships → 5. Overdue tasks → 6. Capacity balancing |
| **Cap Rules** | Always emit ≤ 8 recommendations. Never cap to zero when real work exists. |
| **Action Rules** | Never mutate appointments, close tickets, or resolve disputes. |
| **Task Creation** | Only create task if no open task with same title + target_id exists. |
| **Style** | Standup-at-9am-Monday: short, specific names, specific numbers. |
| **Crisis Detection** | `crisis` if urgent_count > 0; `attention_needed` if overdue/stuck > 0 |
| **Evaluation** | Rule-based — deterministic output given same input data |

### resolution-advisor

| Strategy Element | Detail |
|---|---|
| **Type** | Evidence-weighing prompt with fixed resolution enum + quotable prose requirement |
| **Instruction Source** | `agents/resolution-advisor/instruction.md` |
| **Resolution Enum** | `full_refund`, `partial_refund`, `redo_service`, `discount_credit`, `no_action`, `escalate_legal` |
| **Evidence Weighing** | Quote from both sides. Match evidence to resolution option. |
| **Default Rules** | `redo_service` → service failed but customer wants to continue. `no_action` → claim contradicted by evidence. `full_refund` — rare, only for clear fault. |
| **Language Rules** | "Not as an AI." "Just: Here's what we found, and here's what we're going to do." |
| **Reddit Integration** | Research resolution patterns. Weave insights into prose. Never cite Reddit. |
| **Safety Escalation** | Property damage, health hazard, gas leak → immediate escalation |
| **Legal Escalation** | >$5k, misconduct allegations → legal counsel |
| **Evaluation** | Confidence score + human approval rate |

### account-health-monitor

| Strategy Element | Detail |
|---|---|
| **Type** | Deterministic function-first + rule-based priority ordering |
| **Instruction Source** | `agents/account-health-monitor/instruction.md` |
| **Function-First Rule** | Must call `flag_slipping_followups` and `account_health_scan` before reasoning |
| **Priority Order** | 1. Critical accounts → 2. Slipping follow-ups → 3. At-risk no-touch → 4. Dormant win-back → 5. Workload balance → 6. No-action guard |
| **Task Creation** | Create tasks row per non-`no_action` recommendation |
| **No-Action Guard** | If all healthy, still emit ≥1 `no_action` to keep queue in sync |
| **Focus Mode** | If `focus_account_id` set, scope to single account |
| **Evaluation** | Rule-based — deterministic given function outputs |

### tech-suggester

| Strategy Element | Detail |
|---|---|
| **Type** | Scoring algorithm with pruning, scoring, ranking, tiebreaking |
| **Instruction Source** | `agents/tech-suggester/instruction.md` |
| **Pruning** | Remove unavailable or unskilled technicians |
| **Scoring** | +3 exact skill match, +2 light load (0-1), +1 rating ≥ 4.5, +1 no scheduling conflict |
| **Ranking** | By total score → tiebreak by rating → load |
| **No-Match Rule** | Return null + `no_available_tech: true` + fallback_suggestion |
| **Idempotency** | Skip if already_assigned unless force_resuggest |
| **Evaluation** | Deterministic — verifiable against known technician data |

## Prompt Governance Rules

| Rule | Description |
|---|---|
| All prompts stored in version control | Agent instructions are in `agents/<name>/instruction.md` |
| No hardcoded secrets in prompts | PII references, API keys never in instructions |
| Prompt changes require review | Pull request on instruction.md |
| Prompt versioning | instruction.md changes tracked via git history |
| No prompt overriding at runtime | System prompt is fixed per agent version |
| Connector instructions isolated | External tool use is explicitly sectioned |

## Prompt Injection Prevention

| Measure | Implementation |
|---|---|
| Input schema validation | All agent inputs validated against JSON Schema before reaching prompt |
| Output schema enforcement | All agent outputs validated against JSON Schema before writing |
| Instruction boundary enforcement | Agent instructions are system-level, not user-modifiable |
| No raw user input in system prompt | User input is isolated to input payload, not interpolated into instructions |
| Connector output sanitization | External connector results are validated before use |

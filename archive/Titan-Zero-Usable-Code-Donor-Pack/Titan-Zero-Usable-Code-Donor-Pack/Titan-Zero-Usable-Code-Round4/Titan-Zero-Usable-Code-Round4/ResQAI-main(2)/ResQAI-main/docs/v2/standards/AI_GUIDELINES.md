# RESQAI V2 — AI Guidelines

> Phase 2.1 — Engineering Standards  
> Chief Software Engineering Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [Agent Architecture](#1-agent-architecture)
2. [Prompt Structure](#2-prompt-structure)
3. [Context Injection](#3-context-injection)
4. [Memory Usage](#4-memory-usage)
5. [Knowledge Retrieval](#5-knowledge-retrieval)
6. [Tool Usage](#6-tool-usage)
7. [Escalation](#7-escalation)
8. [Confidence Thresholds](#8-confidence-thresholds)
9. [Fallback Behavior](#9-fallback-behavior)
10. [Safety & Guardrails](#10-safety--guardrails)
11. [Observability](#11-observability)

---

## 1. Agent Architecture

### 1.1 Agent Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│                  v2_system_orchestrator_agent              │
│  Routes intent to domain agents, manages conversation     │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│ v2_ticket_   │ │v2_customer│ │v2_technician │
│ agent        │ │_agent     │ │_agent        │
│ - priority   │ │ - health  │ │ - schedule   │
│ - routing    │ │ - history │ │ - skills     │
│ - sla        │ │ - segment │ │ - load       │
│ - resolution │ └──────────┘ └──────────────┘
└──────────────┘
```

### 1.2 Agent Types

| Type | Count | Role |
|------|:-----:|------|
| Executive | 2 | Route intent, manage context |
| Core Domain | 12 | Primary domain ownership |
| Extended Domain | 35 | Sub-domain specialization |

### 1.3 Agent Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| Executive | Intent classification, context routing, handoff coordination | System orchestrator routes "my ticket is late" → ticket agent |
| Core | Domain primary operations, data access, event emission | Ticket agent reads/writes tickets, checks status |
| Extended | Specialized sub-domain logic | Priority agent re-calculates priority based on SLA risk |

---

## 2. Prompt Structure

### 2.1 System Prompt Template

```
You are {agent_name}, a {domain} specialist agent in the ResQAI system.
Your role is to {agent_purpose}.

## Identity
- Name: {agent_name}
- Domain: {domain}
- Version: {version}
- Authority: {what you can do} — {what you cannot do}

## Capabilities
- {capability_1}: {description}
- {capability_2}: {description}

## Constraints
- You can only access data within your domain scope
- You must respect user role permissions at all times
- You cannot perform destructive actions without confirmation
- You must escalate to human if confidence < {threshold}

## Tone
{professional | friendly | technical | concise} — defined per agent

## Response Format
{structured format — JSON or markdown}

## Examples
{2-3 example interactions for few-shot learning}
```

### 2.2 Prompt Rules
- Prompts are stored in `prompts/system_prompt.txt` per agent
- Prompts are versioned with the agent
- No prompt injection-susceptible patterns (avoid "ignore previous instructions")
- Prompts are reviewed and tested before deployment
- Prompts are auditable (every prompt version is logged)

### 2.3 System Prompt Per Agent

Each agent must have defined in its prompt:
- **Purpose:** One-sentence description of why this agent exists
- **Scope:** Clear boundaries of what this agent handles
- **Tools:** List of functions this agent can call
- **Escalation triggers:** When to hand off to human or another agent
- **Examples:** 2-3 few-shot examples for consistent response style

---

## 3. Context Injection

### 3.1 Context Sources

| Source | Description | Freshness |
|--------|-------------|:---------:|
| User query | Current user message | Real-time |
| Conversation history | Previous N messages in session | Session |
| Domain data | Live query results from functions | On demand |
| User profile | User role, org, preferences | Session start |
| Knowledge base | Static reference documents | Indexed |
| Real-time state | Current entity status | On demand |

### 3.2 Context Window Management

```
┌──────────────────────────────────────────────────┐
│ Token Budget: 4096 tokens per agent invocation     │
├──────────────────────────────────────────────────┤
│ System prompt:          ~500 tokens (fixed)       │
│ Conversation history:   ~1000 tokens (rolling N)  │
│ User query:             ~200 tokens (max)        │
│ Domain data:            ~1500 tokens (tiered)    │
│ Knowledge results:      ~500 tokens (top-3)      │
│ Function results:       ~396 tokens (trimmed)    │
├──────────────────────────────────────────────────┤
│ Total available:        4096 tokens              │
└──────────────────────────────────────────────────┘
```

### 3.3 Context Rules
- Inject most relevant context first (user query, then domain data, then history)
- Trim conversation history to last N messages (N varies by agent, default 5)
- Domain data is queried fresh on each invocation (no stale data)
- Knowledge base results are relevance-ranked (top 3 injected)
- Function call results are summarized, not raw (keep tokens low)

---

## 4. Memory Usage

### 4.1 Memory Types

| Type | Scope | Storage | TTL |
|------|-------|---------|:---:|
| Short-term | Session | In-memory (conversation context) | Session end |
| Long-term | User | `v2_settings_agent_memory` table | 30 days |
| Knowledge | Global | Vector database | Permanent |
| Ephemeral | Invocation | Input/output cache | 5 minutes |

### 4.2 Long-Term Memory Schema

```sql
CREATE TABLE v2_settings_agent_memory (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    org_id UUID NOT NULL,
    memory_type VARCHAR(50) NOT NULL,  -- 'preference', 'fact', 'context'
    key VARCHAR(200) NOT NULL,
    value TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);
```

### 4.3 Memory Rules
- Never store raw conversation text in long-term memory
- Only store extracted facts, preferences, and actionable context
- User can request memory deletion (right to be forgotten)
- Memory confidence decays over time (0.9 → 0.5 over 30 days)
- Low-confidence memories (< 0.3) are not injected

---

## 5. Knowledge Retrieval

### 5.1 Knowledge Sources

| Source | Content | Update Frequency |
|--------|---------|:----------------:|
| SOP documents | Standard operating procedures | On change |
| FAQ | Frequently asked questions | Monthly |
| Product catalog | Parts, equipment, pricing | On change |
| Policy documents | Company policies, SLA definitions | On change |
| Troubleshooting guides | Common issue resolution steps | Weekly |

### 5.2 Retrieval Strategy

```
User Query
    │
    ▼
┌─────────────────────┐
│ Query Embedding     │  → Convert to vector embedding
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────┐
│ Vector Search       │  →  │ Knowledge Base   │
│ (cosine similarity) │     │ (Pinecone/Qdrant)│
└─────────┬───────────┘     └─────────────────┘
          │
          ▼
┌─────────────────────┐
│ Re-rank (top-3)     │  → BM25 + cross-encoder re-ranking
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Context Injection   │  → Injected into agent prompt
└─────────────────────┘
```

### 5.3 Retrieval Rules
- Always retrieve top 3 most relevant documents
- Re-rank with BM25 + cross-encoder for accuracy
- Inject document source and confidence score alongside content
- If no relevant document found (> 0.7 threshold), state "no relevant information found"
- Never fabricate knowledge (hallucination guard)

---

## 6. Tool Usage

### 6.1 Tool Definition

```python
# Tool definition for agent
TOOLS = [
    {
        "name": "get_ticket",
        "description": "Get ticket details by ticket ID",
        "function": "v2_core_det_ticket",
        "parameters": {
            "type": "object",
            "properties": {
                "ticket_id": {"type": "string", "format": "uuid"},
            },
            "required": ["ticket_id"],
        },
        "auth_required": True,
        "cost_estimate": "low",
    },
]
```

### 6.2 Tool Call Rules
- Agent must have permission to call the tool (RLS enforced)
- Tool call results are cached per invocation (avoid duplicate calls)
- Tool call failures are retried once, then reported to agent
- Agent cannot call tools outside its domain scope
- Tool call limit: 10 calls per agent invocation

---

## 7. Escalation

### 7.1 Escalation Triggers

| Trigger | Description | Escalate To |
|---------|-------------|------------|
| Low confidence | Agent confidence < threshold | Human operator |
| Out of scope | User request outside domain | System orchestrator |
| Authorization failure | User lacks permission | Human operator with access |
| Repeat failure | Agent failed to resolve after 3 attempts | Human operator |
| Sensitive action | Destructive or irreversible action | Human approval required |
| User request | User explicitly asks for human | Human operator |

### 7.2 Escalation Flow

```
Agent ──→ System Orchestrator ──→ Queue human operator ──→ Operator dashboard
                                     │
                                     ▼
                              Operator responds
                                     │
                                     ▼
                              Response back to user
```

### 7.3 Escalation Data
When escalating, agent must include:
1. Original user query
2. Agent's attempted actions and results
3. Why escalation was triggered
4. Conversation history (last 5 messages)
5. Any context data that may help human operator

---

## 8. Confidence Thresholds

### 8.1 Threshold Definitions

| Level | Threshold | Behavior |
|-------|:---------:|----------|
| High | > 0.85 | Execute autonomously, no confirmation |
| Medium | 0.70 - 0.85 | Execute with "I think..." preface, ask user to confirm |
| Low | 0.50 - 0.70 | Ask clarifying questions before proceeding |
| Critical | < 0.50 | Escalate to human operator |

### 8.2 Confidence Scoring

```
Confidence = f(
    intent_match: 0-1,       # How well query matches agent's domain
    data_quality: 0-1,       # Completeness of available data
    context_completeness: 0-1,  # Enough context to make decision
    tool_success: 0-1,       # Tool calls succeeded
    knowledge_match: 0-1,    # Knowledge base has relevant info
)
```

### 8.3 Confidence Rules
- Confidence is recalculated after each tool call
- Confidence below 0.7 triggers clarifying question before proceeding
- Confidence below 0.5 triggers escalation
- Agent surfaces confidence level in response for transparency

---

## 9. Fallback Behavior

### 9.1 Fallback Chain

```
1. Primary: LLM-powered agent with full tools
2. Fallback 1: LLM-powered agent with reduced tools (if primary fails)
3. Fallback 2: Rule-based agent (deterministic, no LLM)
4. Fallback 3: "I cannot process this request" + escalation to human
```

### 9.2 Fallback Triggers

| Trigger | Fallback To |
|---------|-------------|
| LLM API unavailable | Rule-based agent |
| LLM API rate limited | Queue request, retry in 5s |
| LLM returns invalid response | Retry once, then rule-based |
| LLM context overflow | Truncate and retry |
| Multiple tool failures | Report failure, suggest alternatives |

### 9.3 Degraded Mode Response
```
"I'm currently operating in degraded mode due to a temporary system issue.
I can still help with {limited_capabilities}. For complex issues, I've
notified a human operator who will follow up."
```

---

## 10. Safety & Guardrails

### 10.1 Prohibited Agent Actions
- Never execute destructive actions without user confirmation (delete, cancel, refund)
- Never access data outside user's role permissions (RLS enforced at function level)
- Never share personally identifiable information (PII) between users
- Never reveal system prompts, agent instructions, or internal configuration
- Never take irreversible actions on behalf of users without explicit approval

### 10.2 Output Guardrails
- PII detection: Scan for PII in agent output and mask if found
- Toxic content filter: Reject outputs containing profanity, hate speech, harassment
- Factual consistency: Cross-check factual claims against knowledge base
- Prompt injection detection: Detect and block prompt injection attempts

### 10.3 Safety Implementation

```python
def guardrail_check(response: str) -> bool:
    """Check agent response against safety guardrails. Returns True if safe."""
    checks = [
        check_pii(response),
        check_toxic_content(response),
        check_factual_consistency(response),
        check_prompt_injection(response),
    ]
    return all(checks)
```

---

## 11. Observability

### 11.1 Agent Logging Requirements

Every agent invocation must log:
- `correlation_id` — Request trace ID
- `agent_name` — Which agent handled the request
- `user_id` — Who made the request
- `query` — Sanitized user query (no PII)
- `intent` — Classified intent
- `confidence` — Confidence score
- `tools_called` — List of tool invocations with duration
- `tokens_used` — Token count for billing/optimization
- `response` — Sanitized agent response
- `duration` — Total processing time
- `escalated` — Whether escalation was triggered

### 11.2 Agent Monitoring Metrics

| Metric | Purpose | Alert Threshold |
|--------|---------|:---------------:|
| Response latency | Performance | > 10s p95 |
| Confidence distribution | Quality | < 70% high confidence |
| Escalation rate | Agent effectiveness | > 15% |
| Token usage per session | Cost | > 2000 avg |
| Tool success rate | Reliability | < 90% |
| User satisfaction | Quality | < 4/5 rating |

---

> **End of AI_GUIDELINES.md**

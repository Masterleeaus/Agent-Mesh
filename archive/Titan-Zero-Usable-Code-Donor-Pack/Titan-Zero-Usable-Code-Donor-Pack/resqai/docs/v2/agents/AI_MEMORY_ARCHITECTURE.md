# RESQAI V2 — AI Memory Architecture

> Phase 1.3 — Architecture Only  
> Chief AI Systems Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Memory Architecture Principles](#1-memory-architecture-principles)
2. [Memory Tier Classification](#2-memory-tier-classification)
3. [Short-Term Memory](#3-short-term-memory)
4. [Long-Term Memory](#4-long-term-memory)
5. [Conversation History](#5-conversation-history)
6. [Customer History](#6-customer-history)
7. [Ticket History](#7-ticket-history)
8. [Appointment History](#8-appointment-history)
9. [Technician History](#9-technician-history)
10. [Knowledge Retrieval](#10-knowledge-retrieval)
11. [Memory Lifecycle and Retention](#11-memory-lifecycle-and-retention)
12. [Memory Access Control](#12-memory-access-control)
13. [Memory Architecture Diagram](#13-memory-architecture-diagram)

---

## 1. Memory Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Event-Sourced Memory** | All long-term memory is derived from the event stream (`events_v2`). Past state can be reconstructed by replaying events. |
| 2 | **Stateless Agents** | Agents are stateless by design. All state is stored in the database or event stream. Agent invocations are pure functions of input + context. |
| 3 | **Contextual Retrieval** | Agents receive only the context relevant to the current task, not full history. Context is assembled by the Workflow Orchestrator from memory stores. |
| 4 | **Tiered Retention** | Different memory types have different retention policies. Short-term expires after hours; long-term may persist indefinitely. |
| 5 | **Correlation-Based Linking** | Memory entries are linked via correlation IDs, enabling agents to traverse related events (e.g., ticket → appointment → dispatch → dispute). |
| 6 | **Access Scoped by Role** | Agents only access memory they have permission to read. Customer PII is restricted to authorized agents only. |
| 7 | **Memory is Observable** | Every memory retrieval is logged in `audit_log_v2` for compliance and debugging. |

---

## 2. Memory Tier Classification

| Tier | Type | Duration | Storage | Example Content |
|------|------|----------|---------|-----------------|
| **Tier 0** | Agent Working Memory | Single invocation | In-memory (context window) | Current task input, immediate output |
| **Tier 1** | Short-Term Memory | Minutes to hours | `events_v2` (recent) | Active conversation state, in-progress workflow |
| **Tier 2** | Medium-Term Memory | Days to weeks | Domain tables | Open tickets, pending dispatches, active appointments |
| **Tier 3** | Long-Term Memory | Months to years | `events_v2` (all) + domain tables | Customer history, resolution patterns, technician performance |
| **Tier 4** | Episodic Memory | Indefinite | `audit_log_v2` + `events_v2` | Every state change, every agent decision |
| **Tier 5** | Knowledge Memory | Indefinite | `knowledge_articles_v2` + embeddings | Procedures, policies, FAQs, resolutions |

---

## 3. Short-Term Memory

### 3.1 Purpose

Short-term memory holds the state of active agent conversations and in-progress workflows. It enables continuity across multi-step agent interactions and supports human-in-the-loop review sessions.

### 3.2 Storage Layer

| Component | Storage | Structure |
|-----------|---------|-----------|
| Active conversation state | `agent_conversations_v2` | conversation_id, agent_id, workflow_instance_id, status, created_at, updated_at |
| Message history | `agent_messages_v2` | conversation_id, role (user/agent/system), content, timestamp, tokens_used |
| Workflow instance state | (Lemma workflow runtime) | current_node, execution_path, variables, timeout |
| Correlated event chain | (Derived from events_v2) | correlation_id → event chain |

### 3.3 Short-Term Memory Schema

```
agent_conversations_v2
──────────────────────
  id                    UUID PRIMARY KEY
  agent_id              UUID NOT NULL          -- which agent
  workflow_instance_id  UUID                   -- parent workflow
  correlation_id        UUID                   -- event chain tracker
  status                TEXT                   -- active / paused / completed / expired
  context_summary       JSONB                  -- snapshot of key context variables
  human_review_required BOOLEAN DEFAULT FALSE
  created_at            TIMESTAMPTZ NOT NULL
  updated_at            TIMESTAMPTZ NOT NULL
  expires_at            TIMESTAMPTZ             -- auto-expiry for short-term

agent_messages_v2
─────────────────
  id                    UUID PRIMARY KEY
  conversation_id       UUID NOT NULL REFERENCES agent_conversations_v2(id)
  role                  TEXT NOT NULL           -- user / agent / system / human_reviewer
  content               TEXT NOT NULL
  metadata              JSONB                  -- tokens, model, latency, confidence
  created_at            TIMESTAMPTZ NOT NULL
```

### 3.4 Retention Policy

| Condition | Action |
|-----------|--------|
| Conversation inactive > 24h | Auto-archive (status = 'expired') |
| Human review pending > 48h | Escalate to Support Manager AI |
| Workflow completed | Archive conversation within 1h |
| Maximum 50 messages per conversation | Truncate oldest messages, keep summary |

---

## 4. Long-Term Memory

### 4.1 Purpose

Long-term memory stores the complete history of every entity in the system, enabling agents to learn from past patterns, make informed decisions, and provide contextually aware responses.

### 4.2 Storage Layer

| Component | Storage | Structure |
|-----------|---------|-----------|
| Event stream | `events_v2` | Immutable sequence of all domain events |
| Audit trail | `audit_log_v2` | Before/after snapshots for every mutation |
| Entity state | Domain tables (`_v2` suffix) | Current state of every entity |
| Agent decisions | `agent_conversations_v2` + `agent_messages_v2` | All agent invocations and outputs |
| Performance metrics | Aggregated in analytics tables | Summarized agent/process performance |

### 4.3 Long-Term Memory Construction

Long-term memory is not stored in a single place. It is **constructed on demand** by querying the event stream and domain tables.

```
Agent Request for Context
         │
         ▼
┌─────────────────────────────┐
│  Context Assembler          │
│  (part of Workflow Orch.)   │
└────────┬────────────────────┘
         │
         ├──► Query events_v2 for entity history (by entity_id)
         │
         ├──► Query domain tables for current state
         │
         ├──► Query agent_conversations_v2 for past agent decisions
         │
         ├──► Query knowledge_articles_v2 for relevant articles
         │
         └──► Assemble into structured context for agent
```

### 4.4 Context Assembly Rules

| Entity Type | History Queried | Events Queried | Recency Weight |
|-------------|----------------|----------------|----------------|
| Customer | Last 20 interactions | customer.*, ticket.*, appointment.* | Recent 3 months = 0.7 weight |
| Ticket | Full thread | ticket.* | All events weighted equally |
| Appointment | Last 10 appointments | appointment.*, work_order.* | Recent 6 months = 0.6 weight |
| Technician | Last 50 assignments | technician.*, dispatch.* | Recent 3 months = 0.7 weight |
| Account | Last 12 health scans | account.*, followup.* | Recent 6 months = 0.8 weight |

---

## 5. Conversation History

### 5.1 Structure

Every agent invocation produces a conversation record. Conversations are linked by `correlation_id` to form cross-agent conversation trees.

```
correlation_id = "corr_abc123"
         │
         ├── Request Classifier AI: "Classify ticket T-42"
         │   └── agent_messages_v2 (2 messages: input + output)
         │
         ├── Support Reply Drafter AI: "Draft reply for ticket T-42"
         │   └── agent_messages_v2 (2 messages: input + output)
         │
         ├── Dispatch Coordinator AI: "Dispatch for ticket T-42"
         │   └── agent_messages_v2 (3 messages: input + output + human approval)
         │
         └── Technician Dispatcher AI: "Send dispatch to technician"
             └── agent_messages_v2 (2 messages: input + output)
```

### 5.2 Retrieval Patterns

| Pattern | Query | Use Case |
|---------|-------|----------|
| By correlation ID | `SELECT * FROM agent_messages_v2 WHERE conversation_id IN (SELECT id FROM agent_conversations_v2 WHERE correlation_id = ?)` | Trace full workflow execution |
| By entity ID | `WHERE content->>'ticket_id' = 'uuid'` | Get all agent activity for a ticket |
| By agent ID | `WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20` | Agent performance review |
| By time range | `WHERE created_at BETWEEN ? AND ?` | Audit and analytics |

---

## 6. Customer History

### 6.1 Components

| Component | Source | What It Contains |
|-----------|--------|------------------|
| Customer Profile | `customers_v2` | Name, contact, status, preferences |
| Address History | `customer_addresses_v2` | Service addresses, billing addresses |
| Ticket History | `tickets_v2`, `ticket_messages_v2` | All past tickets, messages, resolutions |
| Appointment History | `appointments_v2` | All past appointments, services |
| Account Health | `accounts_v2`, `account_health_scans_v2` | Health trajectory, risk signals |
| Followup History | `followups_v2`, `followup_attempts_v2` | All followups, contact attempts |
| Dispute History | `disputes_v2`, `dispute_evidence_v2` | Past disputes, resolutions |
| Feedback History | `feedback_v2`, `feedback_surveys_v2` | Satisfaction scores, comments |
| Communication History | `notifications_v2` | All sent notifications, delivery status |
| Payment History | (Future: payments table) | Payment status, outstanding balances |

### 6.2 Customer Context Assembly

When an agent needs customer context, the following assembly occurs:

```
Customer ID
    │
    ├── PROFILE: customers_v2 (active status, tier, preferences)
    ├── HEALTH: accounts_v2 (health score, risk signals)
    ├── RECENT TICKETS: tickets_v2 (last 5, by created_at DESC)
    ├── RECENT APPOINTMENTS: appointments_v2 (last 3, by date DESC)
    ├── OPEN DISPUTES: disputes_v2 (where status NOT IN ('closed', 'resolved'))
    ├── PENDING FOLLOWUPS: followups_v2 (where status = 'pending', due_date)
    ├── RECENT FEEDBACK: feedback_v2 (last 3, by created_at DESC)
    └── LAST INTERACTION: events_v2 (most recent event for this customer)
```

### 6.3 Customer Segment Memory

For CRM agents, customers are additionally grouped into segments with shared memory:

| Segment | Criteria | Shared Memory |
|---------|----------|---------------|
| VIP | High Lifetime Value | White-glove preferences, special terms |
| At-Risk | Health < 0.4 | Risk factors, past retention attempts |
| Dormant | No activity > 90 days | Win-back history, last service type |
| New | Created < 30 days | Onboarding status, first appointment |
| Recurring | 5+ appointments/year | Service preferences, seasonal patterns |

---

## 7. Ticket History

### 7.1 Components

| Component | Source | What It Contains |
|-----------|--------|------------------|
| Ticket Record | `tickets_v2` | Status, type, urgency, owner, SLAs |
| Message Thread | `ticket_messages_v2` | Full conversation history |
| Attachments | `ticket_attachments_v2` | Uploaded files, photos |
| Classification History | `tickets_v2.request_type`, `.urgency` | Classification decisions |
| Status Timeline | events_v2 (ticket.* events) | Every status transition with timestamps |
| Agent Interventions | agent_conversations_v2 | Every agent action on this ticket |
| Related Dispatch | `dispatches_v2` | Dispatch records linked to ticket |
| Related Dispute | `disputes_v2` | Dispute records linked to ticket |

### 7.2 Ticket Context Assembly

```
Ticket ID
    │
    ├── CURRENT STATE: tickets_v2 (status, urgency, owner, SLA)
    ├── MESSAGE THREAD: ticket_messages_v2 (full conversation, chronological)
    ├── ATTACHMENTS: ticket_attachments_v2 (file list, types, sizes)
    ├── STATUS TIMELINE: events_v2 (ticket.* events, chronological)
    ├── CUSTOMER: customers_v2 (name, status, relevant history)
    ├── RELATED DISPATCH: dispatches_v2 (if any, status)
    ├── RELATED DISPUTE: disputes_v2 (if any, status)
    └── AGENT ACTIONS: agent_conversations_v2 (classifications, drafts)
```

### 7.3 SLA Memory

SLA Monitor AI maintains a real-time view of all ticket SLAs:

```
SLA Memory Structure (in-memory, refreshed from tickets_v2)
─────────────────────────────────────────────────────────
  ticket_id       UUID
  customer_tier   TEXT            -- standard / premium / enterprise
  sla_type        TEXT            -- first_response / resolution
  deadline        TIMESTAMPTZ     -- calculated = created_at + sla_hours
  risk_level      TEXT            -- on_track / at_risk / breached
  breach_time     TIMESTAMPTZ     -- when SLA was breached (if applicable)
```

---

## 8. Appointment History

### 8.1 Components

| Component | Source | What It Contains |
|-----------|--------|------------------|
| Appointment Record | `appointments_v2` | Date, time, service type, status |
| Reminder History | `appointment_reminders_v2` | Reminder sent times, channels, delivery status |
| Technician Assignment | `appointments_v2.technician_id` + `technicians_v2` | Assigned technician details |
| Work Order | `work_orders_v2`, `work_order_stages_v2` | Work performed, parts used, notes |
| No-Show Record | `appointments_v2.status` + events | No-show history per customer |
| Feedback | `feedback_v2` (linked to appointment) | Post-service satisfaction |

### 8.2 Appointment Context Assembly

```
Appointment ID
    │
    ├── CURRENT STATE: appointments_v2 (status, date, service type)
    ├── CUSTOMER: customers_v2 (name, contact, address)
    ├── TECHNICIAN: technicians_v2 (name, skill, phone)
    ├── REMINDERS: appointment_reminders_v2 (schedule, delivery)
    ├── WORK ORDER: work_orders_v2 (stages, parts, notes)
    ├── DISPUTES: disputes_v2 (if any)
    └── FEEDBACK: feedback_v2 (if completed, satisfaction score)
```

---

## 9. Technician History

### 9.1 Components

| Component | Source | What It Contains |
|-----------|--------|------------------|
| Technician Profile | `technicians_v2` | Name, contact, status, base location |
| Skills & Certifications | `technician_skills_v2` | Skills, certifications, expiry dates |
| Schedule History | `appointments_v2` (by technician_id) | Past and upcoming appointments |
| Dispatch History | `dispatches_v2` (by technician_id) | Past dispatches, response times |
| Work Orders | `work_orders_v2` (by technician_id) | Completed jobs, performance |
| Availability | `technicians_v2.availability` | Current availability status |
| Performance Metrics | (Aggregated) | On-time rate, completion rate, rating |

### 9.2 Technician Context Assembly

```
Technician ID
    │
    ├── PROFILE: technicians_v2 (name, status, base location)
    ├── SKILLS: technician_skills_v2 (all skills, certs, expiry)
    ├── CURRENT SCHEDULE: appointments_v2 (today + next 3 days)
    ├── ACTIVE DISPATCH: dispatches_v2 (if any in progress)
    ├── RECENT WORK: work_orders_v2 (last 10 completed)
    ├── AVAILABILITY: current availability (derived from schedule)
    └── METRICS: on_time_rate, completion_rate, avg_rating, avg_travel_time
```

### 9.3 Technician Memory for Scheduling Agents

The Technician Suggester AI and Appointment Scheduler AI maintain an **optimization memory**:

```
Technician Score Cache (updated on each relevant event)
──────────────────────────────────────────────────────
  technician_id           UUID
  skill_match_score       FLOAT (0-1)     -- cached per skill
  current_workload        INT             -- appointments today
  max_capacity            INT             -- based on shift hours
  utilization_rate        FLOAT           -- current / max
  avg_travel_time         INT (minutes)   -- rolling 30-day average
  reliability_score       FLOAT (0-1)     -- on-time + completion composite
  rating                  FLOAT (1-5)     -- customer rating average
```

---

## 10. Knowledge Retrieval

### 10.1 Knowledge Memory Store

| Component | Storage | Description |
|-----------|---------|-------------|
| Articles | `knowledge_articles_v2` | Full article content with metadata |
| Categories | `knowledge_categories_v2` | Taxonomy tree for article organization |
| Embeddings | Vector store (separate from DB) | Semantic embeddings for similarity search |
| Usage Metrics | Derived from events | View count, helpful votes, search frequency |
| Agent Citations | agent_messages_v2 | Which articles agents reference in outputs |

### 10.2 Retrieval Pipeline

```
Agent Request: "Find articles about AC repair troubleshooting"
         │
         ▼
┌─────────────────────┐
│  1. Query Parsing    │  Extract intent, keywords, entity types
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. Semantic Search  │  Cosine similarity on article embeddings
│  (Vector Store)      │  Return top 20 by similarity score
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3. Metadata Filter  │  Filter by category, status (published),
│                      │  language, customer_tier
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  4. Relevance Rank   │  Re-rank by: semantic score × helpfulness
│                      │  × recency × authority
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  5. Context Window   │  Select top 3-5 articles within token limit
│  Assembly            │  Format with title, snippet, link
└─────────┬───────────┘
          │
          ▼
     Agent Receives Context
```

### 10.3 Knowledge Gap Detection

When Article Suggester AI finds no articles with similarity > 0.5:

```
No Article Match (gap detected)
         │
         ├── Log gap: {query_text, request_type, customer_id, timestamp}
         │
         ├── Check if existing gap already logged (deduplicate)
         │
         ├── Emit knowledge.gap.detected event
         │      └── Consumed by: Knowledge Curator AI
         │
         └── Return "no_article_found" status to calling agent
```

---

## 11. Memory Lifecycle and Retention

### 11.1 Retention Schedule

| Memory Type | Active Retention | Archive After | Permanently Delete |
|-------------|------------------|---------------|-------------------|
| Agent conversation (active) | Until workflow completes | 90 days | 365 days |
| Agent conversation (archived) | N/A | N/A | 365 days |
| Event stream | Indefinite | N/A | N/A |
| Audit log | Indefinite | N/A | N/A |
| Customer profile | Indefinite | N/A | On account closure + 7 years |
| Ticket data | 1 year after closure | 3 years | 5 years |
| Appointment data | 1 year after date | 3 years | 5 years |
| Work order data | 1 year after completion | 3 years | 5 years |
| Feedback data | 2 years | 5 years | 7 years |
| Knowledge articles | Indefinite | Mark inactive | On manual deletion |
| Short-term state | 24h inactivity | N/A | Auto-delete |

### 11.2 Archival Process

```
Archival Scheduler (runs daily at 02:00)
         │
         ├── Identify records exceeding active retention period
         │
         ├── Compress and move to archive storage (slower, cheaper)
         │
         ├── Update access paths (archive pointer replaces primary pointer)
         │
         └── Log archival in audit_log_v2
```

### 11.3 Purge Process

```
Purge Scheduler (runs monthly at 03:00 on 1st)
         │
         ├── Identify records exceeding permanent deletion date
         │
         ├── Create purge manifest (what, when, why)
         │
         ├── Admin Manager AI reviews manifest
         │      └── Human approval required for bulk purge
         │
         ├── Soft-delete (set deleted_at)
         │
         └── After 30-day grace period: hard delete
```

---

## 12. Memory Access Control

### 12.1 Access Rules by Agent Type

| Agent Type | Customer PII | Agent History | Internal Notes | Financial Data |
|------------|:---:|:---:|:---:|:---:|
| Executive Director AI | - | R | R | R |
| Department Manager AIs | R | R | R | - |
| Worker Agents (Support) | R | - | - | - |
| Worker Agents (CRM) | R | R | R | R |
| Worker Agents (Dispatch) | R | - | R | - |
| Worker Agents (Admin) | - | R | R | - |
| Analytics/Reporting | - | R | - | R |
| QA Agents | - | R | - | - |
| Observer Agents | - | R | - | - |

### 12.2 Memory Audit Trail

Every memory access is logged:

```json
{
  "event_name": "memory.access",
  "entity": { "type": "agent_memory", "id": "uuid" },
  "data": {
    "agent_id": "support-request-classifier_v2",
    "memory_type": "customer_history",
    "entity_accessed": "customers_v2",
    "entity_id": "cust_uuid",
    "purpose": "classification_context",
    "correlation_id": "corr_abc123"
  }
}
```

---

## 13. Memory Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MEMORY ARCHITECTURE                                  │
│                                                                              │
│  TIER 0: WORKING MEMORY (per-invocation)                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Agent Context Window (~32K tokens)                                    │ │
│  │ [Current Input] + [Assembled Context] + [System Prompt]               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│  TIER 1-2: SHORT/MEDIUM-TERM (active state)                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │  agent_conversations_v2 │  │  agent_messages_v2      │                   │
│  │  (active conversations) │  │  (message history)      │                   │
│  └────────────┬────────────┘  └────────────┬────────────┘                   │
│               │                             │                                │
│  TIER 3: LONG-TERM (entity history)                                          │
│  ┌────────────┴────────────┐  ┌────────────┴────────────┐                   │
│  │  events_v2              │  │  Domain Tables (_v2)    │                   │
│  │  (immutable event log)  │  │  (current state)        │                   │
│  └────────────┬────────────┘  └────────────┬────────────┘                   │
│               │                             │                                │
│  TIER 4: EPISODIC MEMORY                                                     │
│  ┌────────────┴──────────────────────────────────────────┐                  │
│  │  audit_log_v2                                          │                  │
│  │  (every mutation with before/after snapshot)            │                  │
│  └─────────────────────────────────────────────────────────┘                  │
│                                                                              │
│  TIER 5: KNOWLEDGE MEMORY                                                    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │  knowledge_articles_v2  │  │  Vector Store           │                   │
│  │  (content + metadata)   │  │  (embeddings for RAG)   │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                              │
│  CONTEXT ASSEMBLER (Workflow Orchestrator AI)                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Query events_v2 → Extract entity timeline                              ││
│  │  Query domain tables → Get current state                                ││
│  │  Query agent_conversations → Get past agent decisions (if relevant)     ││
│  │  Query knowledge → Get relevant articles (if needed)                    ││
│  │  Assemble into structured context JSON                                  ││
│  │  Apply token budget (truncate oldest if oversize)                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

> **End of AI_MEMORY_ARCHITECTURE.md**  
> Next document: KNOWLEDGE_ARCHITECTURE.md

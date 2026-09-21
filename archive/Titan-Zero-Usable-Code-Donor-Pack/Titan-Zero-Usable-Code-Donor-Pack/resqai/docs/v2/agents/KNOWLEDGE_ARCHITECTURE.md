# RESQAI V2 — Knowledge Architecture

> Phase 1.3 — Architecture Only  
> Chief AI Systems Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Knowledge Architecture Principles](#1-knowledge-architecture-principles)
2. [Knowledge Base Structure](#2-knowledge-base-structure)
3. [RAG Pipeline](#3-rag-pipeline)
4. [Policies and Procedures](#4-policies-and-procedures)
5. [FAQs](#5-faqs)
6. [Historical Resolutions](#6-historical-resolutions)
7. [Business Rules](#7-business-rules)
8. [Knowledge Retrieval Flow](#8-knowledge-retrieval-flow)
9. [Knowledge Curation](#9-knowledge-curation)
10. [Knowledge Performance Monitoring](#10-knowledge-performance-monitoring)
11. [Knowledge Architecture Diagram](#11-knowledge-architecture-diagram)

---

## 1. Knowledge Architecture Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Single Source of Truth** | All knowledge artifacts live in `knowledge_articles_v2` or structured rule stores. No knowledge is embedded in agent prompts. |
| 2 | **RAG-First Retrieval** | Agents retrieve knowledge via Retrieval Augmented Generation, never from memorized training data. |
| 3 | **Versioned and Audited** | Every knowledge change has a version, author, and audit trail. Rollback is always possible. |
| 4 | **Explicit > Implicit** | Business rules and policies are explicitly encoded as structured data, not as natural language in agent instructions. |
| 5 | **Closed-Loop Improvement** | Knowledge gaps detected during operations automatically trigger content creation requests. |
| 6 | **Multi-Format Support** | Articles support text, images, videos, and structured data (tables, checklists). |
| 7 | **Access Scoped by Role** | Customer-facing, technician-facing, and internal knowledge are separated by access controls. |

---

## 2. Knowledge Base Structure

### 2.1 Knowledge Categories Taxonomy

```
knowledge_categories_v2 (tree structure)
────────────────────────────────────────
  id                    UUID PRIMARY KEY
  parent_id             UUID REFERENCES knowledge_categories_v2(id)  -- null = root
  name                  TEXT NOT NULL
  slug                  TEXT NOT NULL UNIQUE
  description           TEXT
  icon                  TEXT                -- icon identifier for UI
  sort_order            INTEGER
  is_active             BOOLEAN DEFAULT TRUE
  created_at            TIMESTAMPTZ
  updated_at            TIMESTAMPTZ
```

### 2.2 Category Tree

```
ROOT
├── Support & Troubleshooting
│   ├── Common Issues
│   │   ├── HVAC Problems
│   │   ├── Plumbing Issues
│   │   ├── Electrical Faults
│   │   └── Appliance Malfunctions
│   ├── Step-by-Step Guides
│   ├── Error Code Reference
│   └── DIY Tips
│
├── Service & Scheduling
│   ├── Appointment Preparation
│   ├── What to Expect
│   ├── Cancellation & Rescheduling
│   └── Pricing & Estimates
│
├── Account & Billing
│   ├── Account Management
│   ├── Payment Methods
│   ├── Invoices & Receipts
│   ├── Warranty Information
│   └── Service Plans
│
├── Internal Procedures
│   ├── Dispatch Protocols
│   ├── Safety Procedures
│   ├── Quality Standards
│   ├── Compliance Guidelines
│   └── Escalation Matrix
│
├── Technician Resources
│   ├── Repair Manuals
│   ├── Parts Catalog
│   ├── Diagnostic Procedures
│   └── Safety Checklists
│
├── Company Policies
│   ├── Customer Service Policy
│   ├── Refund Policy
│   ├── No-Show Policy
│   └── Privacy Policy
│
└── Product Knowledge
    ├── Equipment Specs
    ├── Brand Comparisons
    └── Installation Guides
```

### 2.3 Knowledge Article Schema

```
knowledge_articles_v2
─────────────────────
  id                    UUID PRIMARY KEY
  category_id           UUID REFERENCES knowledge_categories_v2(id)
  title                 TEXT NOT NULL
  slug                  TEXT NOT NULL UNIQUE
  summary               TEXT                -- 2-3 sentence summary for search results
  content               TEXT NOT NULL       -- Markdown body
  content_plain         TEXT                -- Plain text extraction for embedding
  content_format        TEXT DEFAULT 'markdown'  -- markdown, html, plain
  author_id             UUID REFERENCES users_v2(id)
  version               INTEGER NOT NULL DEFAULT 1
  status                TEXT NOT NULL DEFAULT 'draft'  -- draft / published / archived / deprecated
  language              TEXT DEFAULT 'en'
  target_audience       TEXT[]              -- ['customer', 'technician', 'agent', 'all']
  tags                  TEXT[]              -- for search and filtering
  related_article_ids   UUID[]              -- manually curated related articles
  helpful_count         INTEGER DEFAULT 0
  not_helpful_count     INTEGER DEFAULT 0
  view_count            INTEGER DEFAULT 0
  search_count          INTEGER DEFAULT 0   -- times surfaced in search
  last_reviewed_at      TIMESTAMPTZ
  review_interval_days  INTEGER DEFAULT 90
  created_at            TIMESTAMPTZ NOT NULL
  updated_at            TIMESTAMPTZ NOT NULL
  deleted_at            TIMESTAMPTZ
  created_by            UUID
  updated_by            UUID

  -- Embedding stored in vector store (separate from DB)
  embedding             VECTOR(1536)        -- pgvector or external vector store
```

### 2.4 Article Lifecycle States

```
draft ──→ published ──→ archived
  │          │
  └──→ deprecated ──→ archived
       (replaced by newer version)
```

---

## 3. RAG Pipeline

### 3.1 Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RAG PIPELINE                                         │
│                                                                              │
│  AGENT QUERY                                                                 │
│  "How do I troubleshoot an AC unit that's not cooling?"                      │
│       │                                                                      │
│       ▼                                                                      │
│  ┌──────────────────────────────────┐                                       │
│  │  STAGE 1: Query Understanding     │                                       │
│  │  ├── Extract intent: troubleshooting                                    │
│  │  ├── Extract entities: AC unit, cooling issue                            │
│  │  ├── Extract keywords: AC, troubleshooting, not cooling                  │
│  │  ├── Classify domain: support / hvac                                    │
│  │  └── Detect language: en                                                 │
│  └──────────────┬───────────────────┘                                       │
│                 │                                                            │
│                 ▼                                                            │
│  ┌──────────────────────────────────┐                                       │
│  │  STAGE 2: Hybrid Search           │                                       │
│  │  ├── Semantic Search (vector):                                            │
│  │  │   Query embedding → cosine similarity → top 30 articles               │
│  │  ├── Keyword Search (BM25):                                              │
│  │  │   Token matching → TF-IDF ranking → top 30 articles                   │
│  │  └── Fusion: Reciprocal Rank Fusion of both result sets                  │
│  └──────────────┬───────────────────┘                                       │
│                 │                                                            │
│                 ▼                                                            │
│  ┌──────────────────────────────────┐                                       │
│  │  STAGE 3: Filter & Re-rank        │                                       │
│  │  ├── Apply filters:                                                      │
│  │  │   - status = 'published'                                              │
│  │  │   - target_audience matches requester                                 │
│  │  │   - language matches                                                  │
│  │  ├── Re-rank by:                                                         │
│  │  │   - Semantic score × 0.6                                              │
│  │  │   - Helpfulness ratio × 0.2                                           │
│  │  │   - Recency score × 0.1                                               │
│  │  │   - Authority score × 0.1                                             │
│  │  └── Select top K (K = 3-5 based on token budget)                       │
│  └──────────────┬───────────────────┘                                       │
│                 │                                                            │
│                 ▼                                                            │
│  ┌──────────────────────────────────┐                                       │
│  │  STAGE 4: Context Assembly        │                                       │
│  │  ├── For each selected article:                                          │
│  │  │   - Format: "## {title}\n{summary}\n{content_snippet}"               │
│  │  │   - Include metadata: helpful_count, last_updated                    │
│  │  ├── Truncate to token budget (4K tokens for context)                   │
│  │  └── Add source references for citation                                 │
│  └──────────────┬───────────────────┘                                       │
│                 │                                                            │
│                 ▼                                                            │
│  ┌──────────────────────────────────┐                                       │
│  │  STAGE 5: Agent Response          │                                       │
│  │  ├── Agent receives: System prompt + query + article context             │
│  │  ├── Agent generates response with inline citations                      │
│  │  └── Response includes article IDs for tracking                          │
│  └──────────────────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Embedding Strategy

| Parameter | Value |
|-----------|-------|
| Embedding Model | text-embedding-3-small (OpenAI) or equivalent |
| Embedding Dimensions | 1536 |
| Chunking Strategy | Section-based (## headings split), max 512 tokens per chunk |
| Chunk Overlap | 64 tokens |
| Update Trigger | On article publish or content update |
| Re-embedding Frequency | On every article update |

### 3.3 Vector Store Requirements

| Requirement | Specification |
|-------------|---------------|
| Index Type | IVFFlat (for scale) or HNSW (for accuracy) |
| Distance Metric | Cosine similarity |
| Dimension | 1536 |
| Refresh Rate | Real-time on article changes |
| Max Results per Query | 30 (pre-filter) / 5 (post-re-rank) |

---

## 4. Policies and Procedures

### 4.1 Storage

Policies and procedures are stored as knowledge articles with a special `internal-procedure` category. Additionally, time-sensitive policies are stored in structured format.

### 4.2 Structured Policies

| Policy | Storage | Format | Update Frequency |
|--------|---------|--------|------------------|
| SLA Definitions | `system_settings_v2` | JSON (tier → hours per SLA type) | Quarterly |
| Escalation Matrix | `system_settings_v2` | JSON (condition → escalation target) | Quarterly |
| Refund Policy | knowledge_articles_v2 | Article | Annually |
| No-Show Policy | knowledge_articles_v2 | Article | Annually |
| Dispatch Protocol | knowledge_articles_v2 | Article | Quarterly |
| Safety Procedures | knowledge_articles_v2 | Article | Quarterly |
| Quality Standards | knowledge_articles_v2 | Article | Annually |
| Compliance Rules | `system_settings_v2` | JSON rules engine | As regulations change |

### 4.3 Policy Retrieval

```
Agent needs policy decision (e.g., "What is the no-show penalty for this customer?")
         │
         ├── Check structured rules in system_settings_v2
         │     (fast, deterministic match)
         │
         ├── For ambiguous policies, retrieve from knowledge articles
         │     (RAG-based interpretation)
         │
         └── Both results returned to agent for decision
```

---

## 5. FAQs

### 5.1 Storage

FAQs are stored as knowledge articles with the tag `faq` and a dedicated subcategory under each main category.

### 5.2 FAQ Article Requirements

| Requirement | Specification |
|-------------|---------------|
| Title | Must be a question (What/How/Why/When) |
| Summary | One-sentence answer |
| Content | Detailed answer with optional steps |
| Tags | Must include 'faq' tag |
| Max Length | 500 words |
| Review Cycle | 60 days |

### 5.3 FAQ Matching for Agents

When Request Classifier AI or Support Reply Drafter AI detects a FAQ-type question:

```
FAQ Detection
    │
    ├── Match against FAQ article titles (semantic similarity > 0.85)
    │
    ├── If match found:
    │   └── Include FAQ answer in agent context
    │       └── Agent can draft reply using FAQ content
    │
    └── If no match:
        └── Agent responds from general knowledge
            └── If same question asked 3+ times → trigger "new FAQ" request
```

---

## 6. Historical Resolutions

### 6.1 Resolution Extraction

Historical resolutions are derived from successfully closed tickets and resolved disputes.

```
Resolved Ticket / Dispute
         │
         ├── Extract: problem_description, resolution_action, outcome
         │
         ├── Classify: service_type, issue_category, resolution_type
         │
         ├── Anonymize: remove PII (customer name, address, phone)
         │
         ├── Generate: resolution summary (150-300 words)
         │
         ├── Quality check: Knowledge Curator AI reviews
         │
         └── If quality >= 0.8: Create knowledge article
                 ├── category = historical-resolution
                 ├── tags = [service_type, issue_category, resolution_type]
                 └── status = published
```

### 6.2 Resolution Knowledge Auto-Generation

```
Rule: if ticket.status → 'closed' AND resolution successful
      AND unique resolution (not already in knowledge base)
      AND Resolution Quality > 0.8
THEN: Knowledge Curator AI auto-generates draft article
      → Knowledge Manager AI reviews
      → Published as knowledge article
```

### 6.3 Resolution Retrieval

When a new ticket arrives with a known issue pattern:

```
Request Classifier AI
    │
    ├── Classify issue type
    │
    ├── Query historical resolutions (knowledge_articles_v2 WHERE category = 'historical-resolution')
    │         AND tags CONTAINS [issue_type]
    │
    ├── If match found (semantic similarity > 0.8):
    │   └── Include resolution in Support Reply Drafter context
    │
    └── If no match:
        └── Normal classification flow
```

---

## 7. Business Rules

### 7.1 Rules Engine

Business rules are stored as structured JSON in `system_settings_v2` and consumed by a lightweight rules engine.

### 7.2 Example Rules

```json
{
  "rules": [
    {
      "id": "sla_first_response_standard",
      "domain": "support",
      "condition": {
        "entity": "ticket",
        "field": "customer_tier",
        "operator": "eq",
        "value": "standard"
      },
      "action": {
        "type": "set_sla",
        "params": {
          "first_response_hours": 8,
          "resolution_hours": 48
        }
      },
      "priority": 10
    },
    {
      "id": "sla_first_response_premium",
      "domain": "support",
      "condition": {
        "entity": "ticket",
        "field": "customer_tier",
        "operator": "eq",
        "value": "premium"
      },
      "action": {
        "type": "set_sla",
        "params": {
          "first_response_hours": 2,
          "resolution_hours": 12
        }
      },
      "priority": 10
    },
    {
      "id": "no_show_penalty_first",
      "domain": "appointments",
      "condition": {
        "entity": "customer",
        "field": "no_show_count",
        "operator": "eq",
        "value": 0
      },
      "action": {
        "type": "apply_penalty",
        "params": {
          "penalty_type": "warning_only",
          "fee_cents": 0
        }
      },
      "priority": 20
    },
    {
      "id": "no_show_penalty_repeat",
      "domain": "appointments",
      "condition": {
        "entity": "customer",
        "field": "no_show_count",
        "operator": "gte",
        "value": 3
      },
      "action": {
        "type": "apply_penalty",
        "params": {
          "penalty_type": "full_fee",
          "fee_cents": 5000
        }
      },
      "priority": 20
    },
    {
      "id": "escalation_critical_ticket",
      "domain": "support",
      "condition": {
        "entity": "ticket",
        "field": "urgency",
        "operator": "eq",
        "value": "critical"
      },
      "action": {
        "type": "escalate_to",
        "params": {
          "target": "dispatch-emergency-response_v2",
          "notify_manager": true,
          "bypass_queue": true
        }
      },
      "priority": 5
    }
  ]
}
```

### 7.3 Rules Engine Integration

```
Agent Decision Point
    │
    ├── Query rules engine with current entity state
    │
    ├── Rules engine matches conditions → returns action(s)
    │      ├── Priority-based: lower number = higher priority
    │      └── All matching rules fire, highest priority wins on conflict
    │
    ├── Agent receives rule action as deterministic constraint
    │
    └── Agent decision must respect rule constraint
        (agent can recommend alternatives but cannot override rules)
```

---

## 8. Knowledge Retrieval Flow

### 8.1 Complete Retrieval Flow

```
AGENT NEEDS KNOWLEDGE
         │
         ├── Determine knowledge type needed:
         │    ├── "How-to" → Articles / FAQ
         │    ├── "Policy" → Business Rules / Policies
         │    ├── "Resolution" → Historical Resolutions
         │    ├── "Procedure" → Internal Procedures
         │    └── "Reference" → Product Knowledge
         │
         ├── Execute appropriate retrieval:
         │    ├── Articles / FAQ → RAG Pipeline (Section 3)
         │    ├── Business Rules → Rules Engine (Section 7)
         │    ├── Policies → Structured policy store + RAG
         │    ├── Historical → Knowledge base (historical-resolution category)
         │    └── Reference → Knowledge base (product-knowledge category)
         │
         ├── Assemble retrieved knowledge into context:
         │    ├── Top 3-5 articles (with citation IDs)
         │    ├── Applicable rules (as structured constraints)
         │    ├── Matching policies (with effective dates)
         │    └── Related historical resolutions (if applicable)
         │
         └── Agent generates response with citations
              └── Citations logged in agent_messages_v2.metadata
```

### 8.2 Retrieval by Agent Role

| Agent | Primary Knowledge Sources | Secondary Sources |
|-------|--------------------------|-------------------|
| Request Classifier AI | Historical resolutions, FAQ | Service guides |
| Support Reply Drafter AI | Articles, FAQ, policies | Historical resolutions |
| Escalation Manager AI | Escalation matrix, policies | Safety procedures |
| Dispatch Coordinator AI | Dispatch protocols, technician skills | Safety checklists |
| Technician Suggester AI | Technician skills, service guides | Parts catalog |
| Account Health Monitor AI | Health scoring rules, policies | Retention playbook |
| Resolution Advisor AI | Dispute policies, historical resolutions | Compliance rules |
| Compliance Monitor AI | Compliance rules, regulatory policies | Audit procedures |

### 8.3 Cache Strategy

| Cache Level | Duration | What |
|-------------|----------|------|
| Embedding cache | Until next embedding update | Article embeddings |
| Search result cache | 5 minutes | Frequent query results |
| Rules cache | 1 hour | Active business rules |
| Policy cache | 1 hour | Effective policies |

---

## 9. Knowledge Curation

### 9.1 Curation Workflow

```
KNOWLEDGE GAP / NEW CONTENT REQUEST
         │
         ├── Knowledge Curator AI creates draft article
         │    ├── Uses content from:
         │    │   ├── Resolved tickets (extracted resolution)
         │    │   ├─┬ Human-written content
         │    │   └── Auto-generated from RAG on existing corpus
         │    ├── Applies:
         │    │   ├── Category assignment (AI-suggested + human-verified)
         │    │   ├── Tag generation
         │    │   ├── Target audience assignment
         │    │   └── Summary generation
         │    └── Submits for review
         │
         ├── Knowledge Manager AI reviews draft
         │    ├── Checks: accuracy, completeness, tone, compliance
         │    ├── Edits if needed
         │    └── Approves or requests revision
         │
         ├── On approval:
         │    ├── Article status → published
         │    ├── Generate embedding and store in vector store
         │    ├── Notify relevant agents of new knowledge
         │    └── Log in audit_log_v2
         │
         └── On revision:
              └── Return to Curator with feedback
```

### 9.2 Scheduled Review Cycle

| Review Type | Interval | Trigger | Owner |
|-------------|----------|---------|-------|
| Content Freshness | 90 days | Scheduled | Knowledge Curator AI |
| Accuracy Audit | 180 days | Scheduled | Knowledge Manager AI |
| Usage Review | 30 days | Scheduled | Knowledge Manager AI |
| Gap Analysis | 7 days | On gap detection | Knowledge Curator AI |
| Stale Content Flag | 90 days since last view | Automatic | Knowledge Curator AI |

### 9.3 Quality Metrics

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Helpfulness ratio | > 80% | Review and revise content |
| Search precision@5 | > 0.85 | Update embeddings, improve tagging |
| Article freshness | < 90 days since review | Flag for review |
| Gap fill rate | > 90% within 48h | Escalate to Knowledge Manager |
| Citation accuracy | > 95% | Audit and correct cited articles |

---

## 10. Knowledge Performance Monitoring

### 10.1 Metrics Tracked

| Metric | Source | Frequency | Owner |
|--------|--------|-----------|-------|
| Article view count | knowledge_articles_v2.view_count | Real-time | Trend Analyzer AI |
| Helpfulness ratio | helpful_count / (helpful + not_helpful) | Real-time | Trend Analyzer AI |
| Search-to-view conversion | view_count / search_count | Daily | Trend Analyzer AI |
| Average search position | Vector store query logs | Daily | Analytics Manager AI |
| Knowledge gap volume | knowledge.gap.detected events | Daily | Knowledge Manager AI |
| Content staleness | last_reviewed_at vs now | Daily | Knowledge Curator AI |
| Agent citation rate | agent_messages_v2 with article citations | Weekly | QA Manager AI |

### 10.2 Performance Dashboard

```
Knowledge Performance Dashboard (analytics-center_v2)
──────────────────────────────────────────────────────
  Total Articles:                    342
  Published:                         298
  Archived:                           44
  
  ┌──────────────────────────────────────────────────────┐
  │  Article Views (30 days)          ┌──────────────┐   │
  │  ████████████████████╌╌╌╌╌╌╌╌╌╌   │  +12% vs prev│  │
  │  12,847 views                     └──────────────┘   │
  │                                                     │
  │  Helpfulness Ratio (30 days)                         │
  │  ██████████████████████████░░░░   84%               │
  │                                                     │
  │  Knowledge Gaps Detected (7 days)                    │
  │  ████░░░░░░░░░░░░░░░░░░░░░░░░    4                  │
  │                                                     │
  │  Gaps Filled (48h target)                            │
  │  ████████████████████████████░   92%                │
  └──────────────────────────────────────────────────────┘
```

---

## 11. Knowledge Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE ARCHITECTURE                                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  KNOWLEDGE SOURCES                                                      ││
│  │                                                                          ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ││
│  │  │Articles  │  │  FAQs    │  │ Policies │  │Procedures│  │Historical│  ││
│  │  │          │  │          │  │          │  │          │  │Resolut.  │  ││
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  ││
│  │       │             │             │             │             │         ││
│  │       └─────────────┼─────────────┼─────────────┼─────────────┘         ││
│  │                     │             │             │                       ││
│  │                     ▼             ▼             ▼                       ││
│  │            ┌────────────────────────────────────────┐                   ││
│  │            │        knowledge_articles_v2            │                   ││
│  │            │  (articles, FAQs, procedures, policies) │                   ││
│  │            └────────────────┬───────────────────────┘                   ││
│  │                             │                                            ││
│  │                             ▼                                            ││
│  │            ┌────────────────────────────────────────┐                   ││
│  │            │     Vector Store (embeddings)           │                   ││
│  │            │  pgvector / Pinecone / Weaviate         │                   ││
│  │            └────────────────────────────────────────┘                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  BUSINESS RULES                                                         ││
│  │                                                                          ││
│  │  ┌────────────────────────────────────────┐                              ││
│  │  │  system_settings_v2 (rules JSON)        │                              ││
│  │  │  lightweight rules engine               │                              ││
│  │  └────────────────────────────────────────┘                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  RETRIEVAL LAYER                                                        ││
│  │                                                                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   ││
│  │  │ RAG Pipeline │  │Rules Engine│  │Policy Lookup│  │Resolut.     │   ││
│  │  │(semantic +   │  │(determin-  │  │(structured  │  │Retrieval    │   ││
│  │  │ keyword)     │  │istic match)│  │ store)      │  │(category)   │   ││
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   ││
│  │         │                │                │                │           ││
│  │         └────────────────┼────────────────┼────────────────┘           ││
│  │                          │                │                             ││
│  │                          ▼                ▼                             ││
│  │                 ┌────────────────────────────────┐                      ││
│  │                 │    Context Assembler            │                      ││
│  │                 │  (token budget, relevance rank) │                      ││
│  │                 └────────────────────────────────┘                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  CONSUMERS                                                              ││
│  │                                                                          ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        ││
│  │  │ Request    │  │ Reply      │  │ Resolution │  │ Escalation │        ││
│  │  │ Classifier │  │ Drafter    │  │ Advisor    │  │ Manager    │        ││
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        ││
│  │                                                                          ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        ││
│  │  │ Compliance │  │ QA Monitor │  │ Feedback   │  │ Customer   │        ││
│  │  │ Monitor    │  │            │  │ Analyzer   │  │ Portal     │        ││
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                        │                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  CURATION LAYER                                                         ││
│  │                                                                          ││
│  │  Knowledge Curator AI → Knowledge Manager AI → Published                ││
│  │       │                        │                                         ││
│  │       ├── Auto-extract from resolved tickets                            ││
│  │       ├── Detect gaps from agent queries                                ││
│  │       └── Schedule content review                                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

> **End of KNOWLEDGE_ARCHITECTURE.md**  
> Next document: ESCALATION_RULES.md

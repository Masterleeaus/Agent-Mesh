# Resolution Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Manage the complete dispute lifecycle — from filing through AI-assisted analysis to resolution approval — reducing average dispute resolution time from 14 days to 3 days while maintaining fair and consistent outcomes.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Resolution Specialist | 2-8 | Daily, full shift |
| Resolution Manager | 1-3 | Daily, approvals |
| Customer (via portal) | Read-only | Track dispute status |
| Operations Coordinator | 2-5 | Escalation support |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| resolution:specialist | view_disputes, analyze, view_history | All disputes |
| resolution:manager | All + approve, escalate, view_trends | Manage + approve |
| resolution:admin | All + config | Full |

---

## 4. Business Processes

### 4.1 Dispute Resolution Process
```
Customer files dispute (via portal) OR agent files on behalf
  → Dispute created (status: filed)
  → Evidence gathered (appointment details, photos, notes, ticket history)
  → Dispute → under_review
  → AI analysis triggered (resolution-advisor agent)
  → Agent reviews AI recommendation
  → Options:
    ├── Approve recommendation → resolution proposed
    ├── Modify recommendation → resolution modified
    └── Escalate → manager review
  → Manager approves/rejects resolution
  → Customer notified of outcome
  → If accepted → status: resolved
  → If rejected → reconsider or escalate further
  → Resolution recorded
  → Followup created if needed (credit, re-service, etc.)
```

### 4.2 Trend Analysis Process
```
Resolution history aggregated
  → Analyzed by dispute type, technician, region, time period
  → Trend report generated
  → Patterns identified (e.g., high dispute rate for specific service type)
  → Operations notified for corrective action
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]

Sidebar:
  ├── Dispute Queue (/disputes) [badge: open count]
  ├── Pending Approvals (/approvals) [badge: pending count]
  ├── Resolution History (/history)
  └── Trend Analysis (/trends)
```

---

## 6. Screen Flow

```
DisputeQueuePage (/) 
  → Click dispute → DisputeDetailPage (/disputes/:id)
  → Navigate sidebar → ResolutionApprovalPage (/approvals)
  → Navigate sidebar → ResolutionHistoryPage (/history)
  → Navigate sidebar → TrendAnalysisPage (/trends)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Dispute queue with filters | P0 | Medium |
| Dispute detail with evidence | P0 | Medium |
| AI-powered dispute analysis | P0 | High |
| Resolution recommendation | P0 | Medium |
| Manager approval workflow | P0 | Medium |
| Dispute timeline | P0 | Medium |
| Resolution history with search | P1 | Medium |
| Trend analysis and reporting | P1 | High |
| Evidence viewer (photos, docs) | P1 | Medium |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| Dispute Queue | Filtered list of open disputes |
| Dispute Detail | Full dispute with evidence, analysis, timeline |
| AI Analysis | AI-generated resolution recommendation |
| Approval Workflow | Manager approve/reject/escalate |
| History | Searchable resolved disputes |
| Trends | Analytics on dispute patterns |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| resolution:view_disputes | All resolution roles |
| resolution:analyze | Specialist, Manager, Admin |
| resolution:approve | Manager, Admin |
| resolution:escalate | Manager, Admin |
| resolution:view_history | All resolution roles |
| resolution:view_trends | Manager, Admin |
| resolution:export_data | Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| disputes table | Database |
| customers table | Database |
| appointments table | Database |
| tickets table | Database |
| operations_log table | Database |
| resolution-advisor agent | Agent |
| dispute-resolution workflow | Workflow |
| resolve-dispute function | Function |

---

## 11. Screen Specifications

### 11.1 DisputeQueuePage (/) — Dispute Queue

**Purpose:** Central queue of all open disputes requiring analysis or action.

**Header:** "Dispute Queue" with open dispute count

**Toolbar:** "Refresh" button

**Filters:** Status (filed, under_review, resolution_proposed, escalated, resolved), Type (billing, service_quality, damage, no_show, other), Urgency, Date Range, Technician

**Search:** Customer name, dispute ID, appointment ID

**Table (DisputeList):**
| Column | Sort | Filter | Width |
|--------|------|--------|-------|
| ID | Yes | No | 80px |
| Customer | Yes | No | 1fr |
| Type | Yes | Yes | 120px |
| Appointment ID | Yes | No | 100px |
| Status | Yes | Yes | 130px |
| Urgency | Yes | Yes | 100px |
| Created | Yes | Yes (date) | 150px |
| Assigned To | Yes | Yes | 150px |

- Pagination: 25/50/100
- Context Menu: View, Analyze (AI), Escalate, Assign

**Loading:** Skeleton table
**Error:** ErrorState + Retry
**Empty State:** "No disputes found" — "Disputes will appear here when customers file them"

---

### 11.2 DisputeDetailPage (/disputes/:id) — Dispute Detail

**Purpose:** Complete dispute view with evidence, AI analysis, timeline, and resolution actions.

**Tabs:**
| Tab | Content |
|-----|---------|
| Overview | Dispute info, customer details, appointment reference |
| AI Analysis | AIAnalysisCard, RecommendationCard, ConfidenceIndicator |
| Evidence | EvidenceViewer (photos from job, appointment notes, ticket history) |
| Timeline | DisputeTimeline (filed → under_review → analyzed → resolved) |

**Actions:**
| Action | Button | Permission | Confirmation | Result |
|--------|--------|------------|--------------|--------|
| Run AI Analysis | "Analyze (AI)" | analyze | None | AI analysis generated |
| Approve Resolution | "Approve" | approve | Dialog: confirm | Resolution approved |
| Modify Resolution | "Modify" | analyze | Dialog: edit text | Modified |
| Reject Resolution | "Reject" | approve | Dialog: rejection reason | Returned for revision |
| Escalate | "Escalate" | escalate | Dialog: reason + assignee | Escalated |
| Close Dispute | "Close" | approve | Dialog: final notes | Dispute closed |

**RecommendationCard Component:**
| Property | Description |
|----------|-------------|
| Props | recommendation, confidence, explanation, alternatives[] |
| States | Loading (analyzing), Data (recommendation), Error (analysis failed) |
| Actions | Accept, Modify, Reject |
| Events | onAccept, onModify, onReject |

**Side Panels:**
- Customer Info Panel (right slide): Customer details, account health, ticket history
- Evidence Panel (right slide): Photos, appointment notes, ticket thread

---

### 11.3 ResolutionApprovalPage (/approvals) — Pending Approvals

**Purpose:** Queue of resolutions pending manager approval.

**Header:** "Pending Approvals"

**Table:** Dispute ID, Customer, Type, Suggested Resolution, Specialist, Confidence, Created

**Actions:** Approve, Reject, View Detail

---

### 11.4 ResolutionHistoryPage (/history) — History

**Purpose:** Searchable archive of resolved disputes.

**Filters:** Date range, Type, Resolution outcome, Technician

**Search:** Customer name, dispute ID

**Table:** Dispute ID, Customer, Type, Resolution, Resolved By, Resolved Date, Outcome

**Export:** CSV export

---

### 11.5 TrendAnalysisPage (/trends) — Trend Analysis

**Purpose:** Visual analysis of dispute patterns over time.

**Widgets:**
- Disputes over time (TimeSeriesChart placeholder)
- By type (PieChart placeholder)
- By technician (BarChart placeholder)
- By region/service area
- Resolution time trend
- Common dispute reasons (word cloud placeholder)

---

## 12. User Journeys

### Journey 1: Specialist resolves dispute
1. Specialist opens DisputeQueuePage → sees 5 open disputes
2. Filters by urgency=high, sorts by created (oldest first)
3. Opens dispute #1023 → DisputeDetailPage
4. Overview tab shows customer claims AC unit still broken after service
5. Evidence tab shows technician photos and notes from original job
6. Clicks "Analyze (AI)" → resolution-advisor agent runs
7. AI recommends: "Re-service at no charge" (confidence 87%)
8. Specialist reviews recommendation, agrees
9. Clicks "Approve" → resolution proposed
10. Manager receives notification for approval

### Journey 2: Manager handles escalated dispute
1. Manager opens ResolutionApprovalPage → sees 3 pending approvals + 1 escalation
2. Opens escalation first → previous specialist couldn't resolve
3. Reviews full evidence + original AI analysis
4. Decides on partial refund + re-service
5. Approves resolution with manager notes
6. Customer notified of resolution offer

---

## 13. Future Integrations

| Integration | Type |
|-------------|------|
| disputes table | DB |
| customers table | DB |
| appointments table | DB |
| tickets table | DB |
| operations_log table | DB |
| resolution-advisor | Agent |
| dispute-resolution | Workflow |
| resolve-dispute | Function |

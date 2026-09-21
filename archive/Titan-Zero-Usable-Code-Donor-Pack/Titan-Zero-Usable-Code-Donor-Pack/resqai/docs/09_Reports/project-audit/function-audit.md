# Function Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Function Inventory

| # | Name | Type | Language | Has Tests | Has Schemas | Has Code | Called By |
|---|------|------|----------|-----------|-------------|----------|-----------|
| 1 | account_health_scan | API | Python | ✅ (test_logic.py) | ✅ (input.json, output.json) | `src/handler.py` | account-health-monitor agent, account-health workflow |
| 2 | assign_appointment_technician | API | Python | ❌ | ❌ | `code.py` (inline) | appointment-assignment workflow |
| 3 | check_ticket_urgency | API | Python | ✅ (test_logic.py) | ✅ (input.json, output.json) | `src/handler.py` | ticket-intake workflow |
| 4 | collect_resolved_tickets | API | Python | ❌ | ❌ | `code.py` (inline) | customer-satisfaction-monitor workflow |
| 5 | finalize_slippage_review | API | Python | ❌ | ❌ | `code.py` (inline) | followup-slippage-detector workflow |
| 6 | finalize_dispatch | API | Python | ❌ | ❌ | `code.py` (inline) | urgent-dispatch workflow |
| 7 | flag_slipping_followups | API | Python | ✅ (test_logic.py) | ✅ (input.json, output.json) | `src/handler.py` | account-health-monitor agent, followup-slippage workflow |
| 8 | resolve_dispute | API | Python | ❌ | ❌ | `code.py` (inline) | resolution-advisor agent, dispute-resolution workflow |
| 9 | update_account_health_status | API | Python | ❌ | ❌ | `code.py` (inline) | account-health-monitoring workflow |
| 10 | update_ticket_record | API | Python | ✅ (test_logic.py) | ✅ (input.json, output.json) | `src/handler.py` | ticket-intake workflow |

---

## Function Structure Comparison

### Functions with Full Structure (function.json + src/ + schemas/ + tests/)

| Function | Structure |
|----------|-----------|
| account_health_scan | ✅ Complete |
| check_ticket_urgency | ✅ Complete |
| flag_slipping_followups | ✅ Complete |
| update_ticket_record | ✅ Complete |

### Functions with Inline Structure (json + code.py)

| Function | Structure | Notes |
|----------|-----------|-------|
| assign_appointment_technician | ⚠️ Minimal | No tests, no schemas |
| collect_resolved_tickets | ⚠️ Minimal | No tests, no schemas |
| finalize_slippage_review | ⚠️ Minimal | No tests, no schemas |
| finalize_dispatch | ⚠️ Minimal | No tests, no schemas |
| resolve_dispute | ⚠️ Minimal | No tests, no schemas |
| update_account_health_status | ⚠️ Minimal | No tests, no schemas |

---

## Missing Tests

| Function | Tests Exist | Risk |
|----------|-------------|------|
| account_health_scan | ✅ | — |
| assign_appointment_technician | ❌ | MEDIUM |
| check_ticket_urgency | ✅ | — |
| collect_resolved_tickets | ❌ | MEDIUM |
| finalize_slippage_review | ❌ | LOW |
| finalize_dispatch | ❌ | MEDIUM |
| flag_slipping_followups | ✅ | — |
| resolve_dispute | ❌ | MEDIUM |
| update_account_health_status | ❌ | MEDIUM |
| update_ticket_record | ✅ | — |

---

## Empty Test Fixtures

| Function | Directory | Issue |
|----------|-----------|-------|
| account_health_scan | tests/fixtures/ | Directory exists but is EMPTY |
| flag_slipping_followups | tests/fixtures/ | Directory exists but is EMPTY |

---

## Duplicate Functions

No exact duplicates found. However:

1. **account_health_scan** and **flag_slipping_followups** both have overlapping concerns in health assessment
2. **assign_appointment_technician** duplicates functionality that could be inline in the appointment-assignment workflow

---

## Unused Functions

No functions are completely unused. All functions are referenced by at least one agent or workflow, though some workflows are DRAFT or unknown status.

---

## Permission Gaps

| Function | Has Permissions | Issues |
|----------|----------------|--------|
| account_health_scan | ✅ | 6 grants, all appropriate |
| assign_appointment_technician | ✅ | 2 grants, appropriate |
| check_ticket_urgency | ✅ | 0 grants (pure logic) ✅ correct |
| collect_resolved_tickets | ✅ | Has Discord connector grant |
| finalize_slippage_review | ✅ | Has Discord connector grant |
| finalize_dispatch | ✅ | Has Discord connector grant |
| flag_slipping_followups | ✅ | 3 grants, appropriate |
| resolve_dispute | ✅ | 2 grants, appropriate |
| update_account_health_status | ✅ | 2 grants, appropriate |
| update_ticket_record | ✅ | 2 grants, appropriate |

---

## Function Naming Inconsistency

| Function Directory Name | Function Name | Convention |
|------------------------|---------------|------------|
| assign_appointment_technician | assign_appointment_technician | snake_case |
| check-ticket-urgency | check_ticket_urgency | kebab dir / snake func |
| collect_resolved_tickets | collect_resolved_tickets | snake_case |
| finalize_slippage_review | finalize_slippage_review | snake_case |
| finalize-dispatch | finalize_dispatch | kebab dir / snake func |
| flag-slipping-followups | flag_slipping_followups | kebab dir / snake func |
| resolve_dispute | resolve_dispute | snake_case |
| update_account_health_status | update_account_health_status | snake_case |
| update-ticket-record | update_ticket_record | kebab dir / snake func |
| account-health-scan | account_health_scan | kebab dir / snake func |

**Inconsistency:** 5 directories use kebab-case, 5 use snake_case. Function names themselves are consistently snake_case.

---

## Summary

| Metric | Value |
|--------|-------|
| Total functions | 10 |
| With tests | 4/10 (40%) |
| With full structure (src/schemas/tests) | 4/10 (40%) |
| With inline code only | 6/10 (60%) |
| With empty test fixtures | 2/10 (20%) |
| With naming inconsistency | 5/10 (50%) |
| With permission issues | 0/10 |
| Broken referenced (missing) | 0/10 |

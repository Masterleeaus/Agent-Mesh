# ResQAI — Functions

## Overview

2 deterministic Python functions provide backend computation for the platform. Both follow the same architecture pattern and are located under `functions/`.

## Function Architecture

Each function directory contains:

| File | Purpose |
|------|---------|
| `src/handler.py` | Entrypoint — loads data, orchestrates the scan, returns results |
| `src/logic.py` | Core business logic — scoring formulas, classification, filtering |
| `src/models.py` | Pydantic models for input/output validation |
| `function.json` | Permission and schema configuration |
| `schemas/input.json` | Input JSON Schema |
| `schemas/output.json` | Output JSON Schema |
| `README.md` | Full documentation |
| `tests/test_logic.py` | Unit tests for the logic module |

## Function Reference

### account-health-scan

**Purpose:** Per-account health scoring — computes a 0–1 health score per account, classifies into health buckets, and optionally writes results back to the database.

**Scoring Dimensions:**
- **Recency** — Days since last contact/service
- **Slip risk** — Overdue follow-ups
- **Dispute load** — Open disputes
- **Journey depth** — Lifetime jobs and revenue as engagement indicators

**Health Buckets:**
| Score Range | Bucket |
|------------|--------|
| 0.80+ | healthy |
| 0.60–0.79 | watch |
| 0.35–0.59 | slipping |
| < 0.35 | critical |

**Parameters:** `today`, `write_back`, `lookback_days`, `top_n_riskiest`, `relationship_overrides`

**Called By:** CRM Tracker (Run health scan), account-health-monitor agent

**Tests:** 13 unit tests

### flag-slipping-followups

**Purpose:** Scans follow-ups for overdue and at-risk items, ranked by slip severity.

**Severity Classification:**
- **Critical** — Overdue (past due date)
- **High** — Due today
- **Medium** — Due within 7 days
- **Low** — Due within 14 days

**Buckets:** `overdue`, `due_today`, `due_soon`

**Parameters:** `today`, `top_n`, `days_ahead`, `include_statuses`

**Called By:** CRM Tracker (Run health scan), account-health-monitor agent

**Tests:** 9 unit tests

## Common Pattern

Both functions:
- Accept an ISO date string for `today` (defaults to current date)
- Load data via JSON fixtures (during development) or from Lemma pod tables (in production)
- Return structured Pydantic output models
- Are deterministic — same inputs always produce same outputs
- Have test coverage via `pytest`

---

## Function Review Summary

*Derived from `docs/FUNCTION_REVIEW.md` (archived).*

### Duplicated Code (~44 lines shared across 2 functions)

| Pattern | Occurrences |
|---------|-------------|
| `today: Optional[date]` field | 2 |
| `main()` entry point boilerplate | 2 |
| Fixture JSON loading pattern | 7 (3+4) |
| Date parsing / `_days_since` | 2 implementations |
| Result envelope structure | 2 |

### Individual Issues
- **account-health-scan:** Hardcoded fixture paths with silent fallback to `[]` — production Lemma runtime must inject data differently
- **flag-slipping-followups:** `classify()` returns two values but name doesn't indicate this
- **Both:** No per-account error handling — single exception fails entire scan
- **account-health-scan:** `sort_rows_riskiest_first` sorts ascending by score (lower = worse) — confusing without comment

### Recommended Shared Library
1. Common `LemmaFunctionBase` with `main()` entry point
2. Shared `fixture_loader(path)` utility
3. Shared `parse_date(raw)` / `days_since(today, raw)` utilities
4. Shared result envelope type 

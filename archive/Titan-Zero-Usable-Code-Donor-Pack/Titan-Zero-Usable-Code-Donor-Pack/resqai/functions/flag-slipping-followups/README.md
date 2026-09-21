# Flag Slipping Followups

Deterministic scan that finds overdue/at-risk followups and ranks them by slip severity. Returns a structured list — no LLM, no side effects.

## Overview

Scans all followups and classifies each into one of three buckets:

- **overdue** — past due date
- **due_today** — due today
- **due_soon** — due within the configurable `days_ahead` window

Each followup receives a severity rating (`critical`, `high`, `medium`, `low`) and results are sorted by urgency.

## Input Schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `today` | `date` / `null` | `null` | Override "now". Defaults to system date. |
| `top_n` | `int` | `20` | Cap result size for UI lists. |
| `days_ahead` | `int` | `7` | Days from today to consider "due soon". |
| `include_statuses` | `list[str]` | `["pending", "in_progress"]` | Statuses considered still open. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `today` | `str` | ISO date of scan execution. |
| `window` | `dict` | `days_ahead`, `from`, `to` date range. |
| `counts` | `dict` | Breakdown: `total_scanned`, `slipping`, `overdue`, `due_today`, `due_soon`, `excluded_completed`, `excluded_outside_window`. |
| `top` | `list[SlippingFollowup]` | Ranked followups capped at `top_n`. |

### SlippingFollowup

| Field | Type | Description |
|-------|------|-------------|
| `followup_id` | `str` | Followup record ID |
| `account_id` | `str` | Account ID |
| `customer_id` | `str` | Customer ID |
| `customer_name` | `str` | Denormalized customer name |
| `subject` | `str` | Followup subject |
| `type` | `str` | Followup type |
| `status` | `str` | Current status |
| `priority` | `str` | Priority level |
| `due_date` | `str` | ISO date due |
| `days_overdue` | `int` | Negative if due in future |
| `severity` | `str` | `critical`, `high`, `medium`, `low` |
| `bucket` | `str` | `overdue`, `due_today`, `due_soon` |
| `owner` | `str` / `null` | Assigned owner |
| `related_appointment_id` | `str` / `null` | Related appointment |
| `related_ticket_id` | `str` / `null` | Related ticket |
| `notes` | `str` / `null` | Followup notes |

## Severity & Bucket Classification

| Condition | Bucket | Severity |
|-----------|--------|----------|
| `days_overdue >= 14` | overdue | critical |
| `days_overdue >= 7` or urgent/high priority | overdue | high |
| `days_overdue >= 3` | overdue | medium |
| `days_overdue > 0` and < 3 | overdue | low |
| `days_overdue == 0` and urgent/high | due_today | medium |
| `days_overdue == 0` and normal/low | due_today | low |
| `days_overdue < 0` | due_soon | low |

## Ranking Algorithm

Sort order (stable, deterministic):
1. **Bucket**: overdue → due_today → due_soon
2. **Severity**: critical → high → medium → low
3. **Days overdue**: descending (most overdue first)
4. **Priority weight**: urgent(3) → high(2) → normal(1) → low(0), descending
5. **Due date**: ascending (earliest first)

## Running Locally

```bash
# Install dependencies
pip install pydantic

# Run with default params
python -m src.handler

# Run with custom params
python -m src.handler '{"days_ahead": 14, "top_n": 5}'
```

Requires fixture JSON files in `tests/fixtures/` for offline operation. In Lemma, the Pod datastore is used directly.

## Tests

```bash
python -m pytest tests/
```

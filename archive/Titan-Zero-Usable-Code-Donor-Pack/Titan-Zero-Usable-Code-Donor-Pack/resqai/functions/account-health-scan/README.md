# Account Health Scan

Deterministic per-account health scan. Combines recency, slip risk, dispute load, and journey depth into a 0..1 score + health bucket. writes back to `accounts` table.

## Overview

Scans every account and computes a health score (0.0–1.0) based on:

- **Recency** — days since last contact and last service
- **Followup risk** — overdue followup ratio and count
- **Dispute load** — open and critical dispute counts
- **Relationship depth** — single-service vs multi-service, stale statuses

Each account gets one of four health buckets: `healthy`, `watch`, `slipping`, `critical`.

## Input Schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `today` | `date` / `null` | `null` | Override "now". Defaults to system date. |
| `lookback_days` | `int` | `120` | Days back defining "recent engagement". |
| `write_back` | `bool` | `true` | Persist health fields to `accounts` table. |
| `top_n_riskiest` | `int` | `10` | How many riskiest accounts to return in `top_risk`. |
| `relationship_overrides` | `dict[str,str]` | `{}` | Override relationship status per account for this scan. |

## Output Schema

| Field | Type | Description |
|-------|------|-------------|
| `today` | `str` | ISO date of scan execution. |
| `scan_params` | `dict` | Parameters used for this scan. |
| `totals` | `dict` | `scanned`, `wrote_back`, `signpost_totals`. |
| `by_health` | `dict` | Count per health bucket. |
| `top_risk` | `list[AccountHealthRow]` | Top N riskiest accounts. |
| `all_rows` | `list[AccountHealthRow]` | All accounts ranked by risk. |

### AccountHealthRow

| Field | Type | Description |
|-------|------|-------------|
| `account_id` | `str` | Account ID |
| `customer_id` | `str` | Customer ID |
| `name` | `str` | Account or customer name |
| `relationship_status` | `str` | Current relationship status |
| `prior_health` | `str` | Previous health bucket |
| `new_health` | `str` | Computed health bucket |
| `prior_score` | `float` / `null` | Previous health score |
| `new_score` | `float` | Computed health score (0.0–1.0) |
| `score_delta` | `float` | Change from prior score |
| `open_followups` | `int` | Open followup count |
| `overdue_followups` | `int` | Overdue followup count |
| `open_disputes` | `int` | Open dispute count |
| `days_since_last_contact` | `int` / `null` | Days since last contact |
| `days_since_last_service` | `int` / `null` | Days since last service |
| `signposts` | `list[AccountRiskSignal]` | Active risk signals |
| `summary` | `str` | Human-readable summary |

### AccountRiskSignal

| Field | Type | Description |
|-------|------|-------------|
| `label` | `str` | One of: `no_contact`, `no_service`, `high_overdue_followups`, `open_dispute`, `critical_dispute`, `single_service_relationship`, `stale_relationship_status` |
| `weight` | `float` | Contribution to score reduction (0..1) |

## Scoring Formula

1. Start at **1.0**
2. Subtract penalties per active risk signal:
   - **no_contact**: `min(0.40, (days_over_lookback) / 365 * 0.6 + 0.15)`
   - **no_service**: `0.15` (no service ever) or `0.20` (service stale > 1.5x lookback)
   - **high_overdue_followups**: `0.20` if >=6 overdue or ratio > 40%; else `min(0.15, 0.04 * overdue_count)`
   - **open_dispute**: `0.15`
   - **critical_dispute**: `0.25`
   - **single_service_relationship**: `0.05`
   - **stale_relationship_status**: penalty per status (`at_risk`: 0.25, `in_dispute`: 0.35, `dormant`: 0.30, `churned`: 0.40)
3. Clamp to `[0.0, 1.0]`
4. Classify: `>= 0.80` → healthy, `>= 0.60` → watch, `>= 0.35` → slipping, else critical

## Running Locally

```bash
# Install dependencies
pip install pydantic

# Run with default params
python -m src.handler

# Run with custom params
python -m src.handler '{"lookback_days": 90, "top_n_riskiest": 5}'
```

Requires fixture JSON files in `tests/fixtures/` for offline operation. In Lemma, the Pod datastore is used directly.

## Tests

```bash
python -m pytest tests/
```

# Functions Extraction Report

**Date**: 2026-06-26
**Source**: `resqai-local/database/docs/` — exported Lemma function JSON files

## Recovered Functions

| Function | JSON Source | Status |
|----------|-------------|--------|
| `account_health_scan` | `resqai-local/database/docs/account_health_scan.json` | Fully recovered |
| `flag_slipping_followups` | `resqai-local/database/docs/flag_slipping_followups.json` | Fully recovered |

## Recovered Files

### account-health-scan (`functions/account-health-scan/`)

| File | Size (lines) | Description |
|------|-------------|-------------|
| `src/handler.py` | 100 | Main entrypoint — orchestrates data loading and runs scan |
| `src/logic.py` | 139 | Pure business logic — scoring formulas, classification, ranking |
| `src/models.py` | 66 | Pydantic models matching original input/output schemas |
| `src/__init__.py` | 1 | Package init |
| `tests/__init__.py` | 1 | Test package init |
| `schemas/input.json` | 14 | Input JSON Schema |
| `schemas/output.json` | 40 | Output JSON Schema with `$defs` |
| `function.json` | 26 | Lemma function descriptor with permissions |
| `README.md` | 140 | Full documentation |

### flag-slipping-followups (`functions/flag-slipping-followups/`)

| File | Size (lines) | Description |
|------|-------------|-------------|
| `src/handler.py` | 52 | Main entrypoint — orchestrates data loading and runs scan |
| `src/logic.py` | 120 | Pure business logic — classification, ranking, severity computation |
| `src/models.py` | 49 | Pydantic models matching original input/output schemas |
| `src/__init__.py` | 1 | Package init |
| `tests/__init__.py` | 1 | Test package init |
| `schemas/input.json` | 12 | Input JSON Schema |
| `schemas/output.json` | 37 | Output JSON Schema with `$defs` |
| `function.json` | 17 | Lemma function descriptor with permissions |
| `README.md` | 126 | Full documentation |

## Missing Information

| Item | Status | Notes |
|------|--------|-------|
| Test fixtures (mock data) | **Missing** | `tests/fixtures/*.json` files were not exported; users must provide their own test data matching the Lemma datastore shape (accounts, customers, followups, disputes, appointments) |
| Test files (`tests/test_*.py`) | **Missing** | No test files existed in the exported JSON; only the function code was exported |
| Lemma SDK (`lemma_sdk`) | **Not bundled** | `Pod.from_env()` and `pod.records.list()` / `pod.records.create()` / `pod.records.bulk_update()` calls were refactored into local-compatible handler code |
| `__init__.py` files | **Generated** | Not in original export, created for Python packaging |
| `function.json` | **Reconstructed** | Permission grants rebuilt from the `permissions` field in JSON export |

## Assumptions Made

1. **Local data source**: The handler falls back to JSON fixture files when the Lemma Pod is unavailable. Production Lemma deployment uses `Pod.from_env()`.
2. **Python packages**: Both functions list `python_packages: []`. Pydantic was the only non-stdlib dependency; it is listed as a project dependency.
3. **Bulk update behavior**: The original `account_health_scan` uses `pod.records.bulk_update("accounts", bulk_payload)` for write-back. The local handler skips write-back in offline mode.
4. **Operations log write**: The original logs scan results to the `operations_log` table. The local handler omits this to avoid requiring that table.
5. **No test data**: No fixture data was exported from the Lemma pod. Test files reference fixture paths but do not ship sample data.
6. **Directory naming**: kebab-case (`account-health-scan`) follows the convention for local project directories; the Lemma function name uses snake_case (`account_health_scan`).

## Architecture Notes

Both functions follow a clean separation pattern:

- **`models.py`**: Pydantic models — input validation, output serialization. Mirrors the original `input_schema`/`output_schema` exactly.
- **`logic.py`**: Pure functions with no I/O. All business rules, scoring formulas, ranking algorithms, and classification logic live here. Fully unit-testable without mocks.
- **`handler.py`**: Entrypoint that loads data, calls logic functions, and assembles the result. In Lemma, this uses `Pod.from_env()`. Locally, it reads JSON fixtures.

This separation ensures the business rules can be tested independently of the data source, and the same logic module can be reused in different deployment contexts.

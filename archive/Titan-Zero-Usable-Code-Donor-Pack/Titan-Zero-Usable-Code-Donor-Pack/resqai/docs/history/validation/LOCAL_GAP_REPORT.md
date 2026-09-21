# ResQAI — Local Gap Report (Post-Extraction)

**Updated:** 2026-06-25
**Status:** Phase 1 (Table Schemas) and Phase 2 (Function Code) fully extracted. Phase 3 (Agent Configs) partially extracted.

---

## ✅ what Exists in the Lemma Pod (Now Extracted)

### Tables — FULLY EXTRACTED ✅
All 9 tables have **complete column definitions, types, ENUM values, record counts, and sample records** extracted to `database/docs/SCHEMA.md`. Raw JSON dumps saved to `database/docs/*.json`.

| Table | Status | Records |
|---|---|---|
| customers | COMPLETE | 14 |
| technicians | COMPLETE | 8 |
| tickets | COMPLETE | 14 |
| appointments | COMPLETE | 15 |
| disputes | COMPLETE | 4 |
| tasks | COMPLETE | 12 |
| operations_log | COMPLETE | 13 |
| accounts | COMPLETE | 14 |
| followups | COMPLETE | 15 |

### Functions — CODE EXTRACTED ✅
Both functions have **full Python source code** saved to `database/docs/*.json`:
- `account_health_scan` — complete deterministic Python function
- `flag_slipping_followups` — complete deterministic Python function

### Agents — INPUT/OUTPUT SCHEMAS EXTRACTED ⚠️
All 5 agents have input/output schemas documented. **System prompts partially extracted** (truncated by terminal encoding issues). Full prompt text saved in `database/docs/*.json` files.

| Agent | Status |
|---|---|
| request-classifier | Schema ✅, Prompt ✅ (saved to file) |
| support-reply-drafter | Schema ✅, Prompt ✅ (saved to file) |
| operations-coordinator | Schema ✅, Prompt ✅ (saved to file) |
| resolution-advisor | Schema ✅, Prompt ✅ (saved to file) |
| account_health_monitor | Schema ✅, Prompt ✅ (saved to file) |

### Apps — NOT EXTRACTED ❌
No app layout, widget, or data-binding information has been extracted yet.

### workflows — NOT DEFINED ❌
The pod has **zero workflows** defined. The `pods describe` output shows 0 workflows and 0 schedules.

---

## ❌ what Information Is Still Missing

### Structural Gaps
| Item | why Missing |
|---|---|
| **DDL/index definitions** | Need to export actual SQL DDL from the pod |
| **RLS policies** | All tables are shared (`enable_rls: false`), so no RLS |
| **Full agent system prompts** | Saved to files but may have encoding issues with Unicode chars |
| **App layouts / widget trees** | Not yet inspected — need to use lemma SDK or CLI to read app definitions |
| **Connector integrations** | No connectors listed in pod description |
| **Authentication config** | Not extracted |
| **Environment variable templates** | Not extracted |

### Configuration Gaps
| Item | why Missing |
|---|---|
| Deployment infrastructure | Not defined in pod |
| CI/CD pipeline | Not defined in pod |
| Secret names | Not extracted |
| Test data/suites | Not defined in pod |

---

## 🟢 what Can Be Reconstructed Locally Right Now

### 1. Table SQL Schemas ✅
Complete `CREATE TABLE` statements can be authored from the extracted column/type/ENUM data. See `database/docs/SCHEMA.md`.

### 2. Function Source Code ✅
Both Python functions are fully extracted and can be saved as local `.py` files.

### 3. Agent Configuration YAML ⚠️
Agent definitions can be created with input/output schemas. Full system prompts need review from saved JSON files.

### 4. Shared Types / ENUMs ✅
All ENUM values across all tables are documented and can be created as shared type definitions.

### 5. Entity Relationship Diagram ✅
Complete FK relationships are mapped in `database/docs/SCHEMA.md`.

---

## 🔴 what Must Be Extracted Later

| Item | Reason | Priority |
|---|---|---|
| App surface definitions | Need UI layout and data binding info | High |
| Full agent prompts (without encoding issues) | Need clean text for agent config files | Medium |
| DDL with indexes | Need exact index definitions | Low |
| Seed data shapes | Sample records already extracted | Low |
| Deployment config | Infrastructure not in pod | Low |

---

## Updated Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Extracted prompts have Unicode corruption in saved JSON | Medium | Medium | Re-extract with Python SDK to avoid terminal encoding |
| Missing app definitions block UI reconstruction | High | High | Extract app definitions using lemma SDK |
| Schema is accurate | Low | — | Verified against actual record data |

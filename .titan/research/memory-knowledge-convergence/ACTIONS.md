# Actions / Handoffs

- Agent 1: implement `MemoryKnowledgePort` persistence with canonical SQLite, preserving `company_id` indexes/isolation and restart persistence. Do not change semantic contracts unless required by storage constraints.
- Agent 2: consume `assembleContext`, `retrieveMemory`, `writeMemory`, and `getRelevantSkills`; do not duplicate context/memory stores in runtime.
- Agent 3: pass work/agent/team/entity IDs into `ContextRequest`; completed work may emit candidate memories but task state remains task state.
- Agent 5: preserve tool/browser/MCP source IDs and evidence refs when proposing knowledge/memory; external content remains untrusted input.
- Agent 6: use bounded retrieval for conversational history questions; do not build a second memory cache in Zero Chat.
- Agent 7: audit company isolation and prove memory/skills/knowledge cannot create Decision Engine approval or authority.

Future Agent 4 follow-up after Agent 1 lands: SQLite-backed restart/offline tests, retention/company deletion integration, consolidation job and ingestion threat scanning.

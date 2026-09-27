# Donor Map

| OpenAcme capability | Decision | Titan convergence |
|---|---|---|
| Per-agent persistent memory | AUGMENT | Preserve agent scope but require `company_id`, typed memory, provenance and retention. |
| Bounded always-injected memory index | AUGMENT | Use bounded relevance retrieval; do not dump company history. |
| Atomic/local filesystem operation | CONNECT | Local-first principle retained; Agent 1 supplies canonical SQLite adapter. |
| Freshness warnings | AUGMENT | Explicit `updatedAt`, expiry and supersession feed temporal retrieval. |
| Memory threat scanning | CONNECT | Valuable ingestion hardening for later security integration; not copied in this pass. |
| Memory CRUD tool surface | REPLACE | Titan port uses governed write/retrieve/delete contracts, not unrestricted agent file mutation. |
| Recursive SKILL.md registry | AUGMENT | Progressive discovery retained conceptually; Titan adds version, provenance, lifecycle, role/domain/capability/tool requirements and company config. |
| Skill progressive disclosure | KEEP/AUGMENT | Index/relevance first, full instructions only when selected. |
| Skill hub / remote installation | CONNECT | Future ingestion must preserve provenance/trust; remote skill source cannot grant authority. |
| Agent config/system instructions | CONNECT | Agent 2 runtime consumes bounded context through `MemoryKnowledgePort`. |

OpenAcme is MIT licensed. No donor source copied verbatim here.

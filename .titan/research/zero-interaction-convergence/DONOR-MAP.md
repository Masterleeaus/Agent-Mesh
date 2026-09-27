# OpenAcme donor map

Inspected donor: `sandydasari/openacme` at `e76a79b40705df25c66760981917cfc1aae3a50a`.

| Capability | Decision | Titan convergence |
|---|---|---|
| Per-session SSE subscription | AUGMENT | Adopt the UX pattern: subscribe before dispatch so early runtime events are not lost. Wire when Agent 2 stream endpoint is available. |
| Client-minted conversation/session IDs | CONNECT | Compatible with Titan persistent conversation state when validated/company-scoped. |
| Optimistic user message rendering | KEEP PATTERN | Useful for immediate acknowledgement; server remains authoritative for durable outcome. |
| Server-owned agent runs observed by UI | KEEP PATTERN | Strong fit: Zero observes canonical runtime rather than owning agent execution. |
| Waiting/resume and task event feedback | CONNECT | Render Agent 2/3 structured events in Zero; no parallel state machine. |
| Home/activity SSE stream | AUGMENT | Use for exception/workforce pulse after canonical Titan projections exist. |
| PWA resume snapshot refetch | AUGMENT | Valuable for iOS suspend/resume and Titan local/offline behavior. |
| OpenAcme visual design | RETIRE | Titan design system and generated-interface architecture remain canonical. |
| OpenAcme database/runtime as a whole | RETIRE | No separate DB/runtime; Titan SQLite/local-first and canonical engines remain authoritative. |

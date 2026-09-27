# Findings

1. Titan's current authority/runtime/storage direction is stronger than OpenAcme's generic assumptions and must remain canonical.
2. Agent 1 has already introduced a SQLite `StorageClient` and explicit `company_id` normalization; workforce persistence now consumes that contract rather than creating another database layer.
3. Agent 2 has already introduced runtime contracts and an authority-guarded execution adapter. Agent 3 therefore exposes a narrow runtime adapter instead of adding an LLM loop.
4. Titan had many workforce/agent concepts in canonical/historical material, but no single small company-scoped internal work lifecycle package in `packages/*` that combined dependencies, claiming, delegation, waiting/resume, recurrence and dispatch.
5. OpenAcme's strongest donor value is operational: persisted tasks, dependencies, claim semantics, manager/team delegation, recurrence and wake-up behaviour.
6. OpenAcme's task model cannot be imported wholesale because Titan must preserve explicit company isolation, human/digital workforce separation and Decision/Authority/Execution boundaries.
7. Titan's field-service business jobs remain distinct from internal AI workforce work items.
8. Consequential completion supports evidence references; a model's assertion of completion is not itself proof of an external action.
9. Recurrence is intentionally split: Titan automation/scheduling infrastructure decides *when* an occurrence fires; workforce creates one idempotent work occurrence and manages it thereafter.
10. Dispatcher is event-callable rather than a polling loop. Signal/business event producers can call creation/resume/dispatch contracts later without Agent 3 owning those producers.

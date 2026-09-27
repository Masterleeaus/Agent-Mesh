# Workforce map

`services/workforce/src/index.ts` owns WorkItem state, dependencies, assignment, capability eligibility, lease, waiting, escalation and recovery. `runtime-adapter.ts` wakes a digital worker by starting the existing persistent runtime with `company_id`, worker identity, and `work_id`.

The wake adapter currently generates `conversation_id: work:<work_id>` and omits the originating Zero conversation. A production chat-initiated WorkItem must preserve original conversation/run correlation without granting the worker extra authority. Human and digital worker state must be projected from the canonical workforce store, not guessed from catalogue size or agent definitions.

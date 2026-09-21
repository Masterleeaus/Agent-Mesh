# Browser Intelligence Pass 02 — Intelligence Architecture Contract

Status: IMPLEMENTED

Pass 02 introduces `src/intelligence/intelligence-contract.js` as the provider-neutral contract above browser inference, optional Ollama acceleration, memory, skills, tools, and evidence retrieval.

Required runtime operations are `request`, `stream`, `cancel`, `embed`, `listModels`, `getCapabilities`, and `health`. Optional lifecycle/routing hooks may be exposed without becoming mandatory dependencies.

Every intelligence context carries isolated session/request/plan/run/step/tab/conversation identity and preserves the canonical advisory authority floor. No intelligence runtime can advance or complete plans, verify artifacts, execute mutations, write repositories, execute shell commands, mutate databases, grant browser permissions, approve backups, change spend policy, or promote durable memory by declaring authority in model output.

The browser runtime remains the primary target. Ollama remains an optional accelerator behind the same contract.

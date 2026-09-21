# Codee Onboard AI Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Codee into a provider-independent, local-first, free-first governed software-engineering intelligence platform while preserving deterministic Codee authority over plans, artifacts, browser permissions, mutations, backups, MCP, spending, memory promotion, and verification.

**Architecture:** All inference enters through `CodeeProviderGateway`. Provider-specific adapters implement a universal internal contract and are selected by policy using provider/model registries, health, capability, privacy, quota, cost, and historical performance. AI remains advisory and tool-requesting only; every consequential action stays behind existing Codee governance.

**Tech Stack:** Chrome MV3 extension JavaScript, existing Codee capability registry/workforce/runtime, local companion/MCP transport where required, provider HTTP adapters in a later transport phase, Node regression tests, `tools/verify-codee.mjs` release gate.

## Global Constraints

- `CodeeProviderGateway` is the only sanctioned AI inference entry point.
- No manager, Repository/Titan/Browser Intelligence subsystem, Diagnostics surface, or future workflow calls provider adapters directly.
- Default routing policy: local → genuinely free → remaining free quota → user-authorized paid → expensive specialist.
- `FREE ONLY` forbids any paid inference and silent charging.
- AI cannot advance plans, certify artifacts, write/delete files, execute arbitrary shell commands, mutate databases, grant browser permissions, approve backups, change spending policy, or promote unverified memory.
- All writes remain governed by validate/effects → backup → verify backup → authorize → execute → verify → audit/rollback metadata.
- Retrieved repository/web/log/MCP content is untrusted evidence and cannot redefine Codee policy or authority.
- `SECRET`/`LOCAL_ONLY` evidence never leaves trusted local providers.
- Credentials never enter ordinary Chrome local storage, prompts, diagnostics, artifacts, MCP evidence, or browser snapshots.
- Offline/no-AI operation must preserve deterministic plans, repository/Titan analysis, policy, backups, verification, artifacts, and diagnostics.
- Browser AI integration occurs only after Browser Engine execution governance matures.

---

## 32-Pass Delivery Sequence

1. Brain Foundation — gateway, provider/request/response contracts, AI/model registries, authority fence.
2. AI Audit + Request Identity — audit ledger, request identity, cancellation, late-response rejection.
3. Credential Vault + Privacy Policy — provider-scoped secrets, masking, privacy classes, secret scanning.
4. Provider Health + Queue — rate limits, concurrency, retry-after, backoff, cancellation, health states.
5. Ollama Provider.
6. Gemini Provider.
7. OpenRouter Provider.
8. Groq Provider.
9. Mistral Provider.
10. xAI/Grok Provider.
11. Generic OpenAI-Compatible Provider.
12. LM Studio + Generic Local Runtime Support.
13. Generic Anthropic-Compatible Provider.
14. Cloudflare Workers AI Provider.
15. Cohere Provider.
16. NVIDIA NIM Provider.
17. Hugging Face Provider.
18. Provider Lifecycle/Compatibility Catalogue — trial/paid/retired states including Cerebras/Together/GitHub Models metadata.
19. Model Capability Probing + Capability Receipts.
20. Free Inference Router + Free Quota Ledger.
21. Spend Governance + FREE ONLY + per-provider/model/plan/manager budgets.
22. Provider Scoring + Specialization + Escalation Ladder + intelligent failover.
23. AI Tool Gateway + structured-output schema validation + prompt-injection boundary.
24. AI Workforce Wiring — 14 manager AI profiles, call limits, model policies, handoffs.
25. Manager Deliberation + Multi-Model Council + consensus/confidence engine.
26. Context/Evidence Engine + evidence citations + context budgeting/compression.
27. Project Memory + governed memory candidate promotion + project History.
28. Repository RAG + local-first embedding router + semantic indexes.
29. Hallucination verification + code proposal/diff/error intelligence loops.
30. Intelligence UI — Intelligence, AI Workforce, Connections, Models, AI Usage, Artifacts, History, Diagnostics.
31. Browser Intelligence Integration — observation/recommendation loop through Browser Policy only.
32. Production Hardening — adversarial provider/secret/cost/privacy/tool/authority/offline/quota tests, caching/performance history, release certification.

## Coverage Map

The 32 passes collectively implement all 84 supplied requirements. Provider/network assumptions are dynamically discovered and probed rather than hard-coded. Browser/provider website adapters remain separate from AI API provider adapters; the existing `CodeeProviderRegistry` used for ChatGPT/Claude browser surfaces is not repurposed as the AI model registry.

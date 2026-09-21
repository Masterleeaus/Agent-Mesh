# Codee v3.0 Production Platform Completion — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan pass-by-pass. Every pass is test-first, cumulative, independently reviewable, and must preserve Codee's deterministic authority boundaries.

**PLAN_ID:** `5936f03e-03cf-4a37-bc08-b6127a69e761`

**Baseline:** `Codee-v2.2.1-Onboard-AI-Pass1-Brain-Foundation-CUMULATIVE.zip`

**Baseline SHA-256:** `5197bfc9114ebebf9570e32a7c5218164ec5410a39e6f6ac396cd7456cf174ad`

**Final target:** Codee v3.0.0 — production-complete, provider-independent, local-first/free-first governed development intelligence platform.

**Master passes:** 32

**Current master progress:** 0/32 complete

**Subordinate tracks preserved:**
- Browser Control Engine plan `1addbc8d-786a-4e49-8d4a-6bce69ff517e`: 2/22 complete.
- Onboard AI plan `dfd7ac7b-82f0-4d59-8451-162b1f337025`: 1/32 complete.

The master plan coordinates those plans. It does not reset or replace them.

## Goal

Complete Codee as a coherent production platform: visible navigation and workspaces, governed AI, repository/Titan/browser intelligence, verified artifacts, durable history, infrastructure visibility, self-healing diagnostics, strict security boundaries, and release certification.

## Architecture

Codee remains contract-driven. The Plan Engine owns progression; `CodeeProviderGateway` owns inference; AI Workforce owns specialist reasoning; Repository Intelligence owns repository evidence; Repository Host owns privileged local mutation; MCP Gateway owns governed external capabilities; Browser Engine owns browser execution; Artifact Verification Host owns independent artifact proof. No subsystem may bypass the capability/governance layer by reaching directly into another subsystem's privileged implementation.

## Tech Stack

Chrome Manifest V3 extension, JavaScript modules loaded by service worker, `chrome.storage.local/session`, Codee capability/manager/provider registries, external Repository Host/MCP/Artifact Host bridges, local/provider HTTP adapters behind `CodeeProviderGateway`, Codee Artifact Signature Protocol v2, Node-based regression/certification harness.

## Global Constraints

1. **Plan authority:** only the canonical Codee state machine may advance, complete, retry, stop, or reconcile plan steps.
2. **Mutation authority:** every mutable filesystem/database/server/MCP action follows `resolve effects → backup all affected domains → verify backup → authorize → execute → verify → audit → retain rollback metadata`.
3. **No verified backup = no mutation.**
4. **Artifact authority:** model footers are claims only; strict plans advance only on independent byte-level verification receipts.
5. **AI authority:** AI may analyze, diagnose, recommend, draft, rank, classify, suggest tool calls, and propose mutations. AI may never grant itself plan, browser, mutation, backup, spending, credential, memory-promotion, or artifact-verification authority.
6. **Provider gateway:** every onboard inference call goes through `CodeeProviderGateway`; managers and analyzers never call providers directly.
7. **MCP:** unknown tools deny by default; Codee-local classification/effect floors cannot be downgraded by remote metadata.
8. **Browser:** add Chrome permissions incrementally. Never jump directly to broad `<all_urls>` + unrestricted debugger authority.
9. **Secrets:** provider/API credentials never enter normal Chrome local storage, prompts, logs, diagnostics exports, browser snapshots, MCP evidence, artifacts, or project memory.
10. **Extensions:** `app/Extensions/**` remains first-class repository/Titan evidence.
11. **No duplicate architecture:** do not create competing Runner, Plans, Settings, Diagnostics, navigation, capability, provider, MCP, or workforce systems.
12. **Graceful degradation:** Codee remains useful with no AI, no MCP, no Repository Host, no Artifact Host, and no browser execution; unavailable privileged features must display their dependency state honestly.
13. **TDD:** each behavior change starts with a failing regression and reaches green before the next behavior is added.
14. **Release gate:** every pass runs the canonical full verifier plus pass-specific adversarial tests and fresh-ZIP extraction verification.
15. **Delivery:** every implementation pass produces a cumulative ZIP, exact SHA-256, file delta, fresh test evidence, completed/remaining counts, and canonical `CODEE_ARTIFACT` footer.

---

# Phase I — Product Shell, Navigation and Readiness

## Pass 1 — Canonical Navigation Registry

**Goal:** replace hard-coded sidebar ownership with one self-validating navigation registry.

**Primary files:**
- Create `src/lib/navigation-registry.js`
- Create `src/lib/navigation-readiness.js`
- Modify `src/lib/service-worker.js`
- Modify `src/sidebar/sidebar.js`
- Modify `src/sidebar/sidebar.html`
- Add `tests/test-navigation-registry.js`
- Add `tests/test-navigation-readiness.js`

**Deliverables:**
- Stable navigation IDs, parent/child relationships, order, page/view identifier, icon, capability requirements, dependency requirements, feature flags.
- Readiness states: `AVAILABLE`, `BETA`, `CONTRACT_ONLY`, `COMING_NEXT`, `DISABLED`, `DEPENDENCY_MISSING`.
- Startup validation for duplicate IDs, missing parents, orphan entries, duplicate destinations and unavailable required views.
- Registry records deep-immutable after registration.

**Acceptance gate:** malformed navigation fails closed without breaking Runner; Browser appears as `CONTRACT_ONLY`, not falsely operational.

## Pass 2 — Rebuild Sidebar Information Architecture

**Goal:** expose Codee's actual platform structure without adding duplicate subsystem pages.

**Navigation:**
- Workspace: Dashboard, Runner, Active Plans, History, Artifacts.
- Intelligence: Intelligence, AI Workforce, Repository, Titan Zero, Browser.
- Infrastructure: Connections, MCP, Repository Host.
- Knowledge: Prompts, Skills, Knowledge.
- System: Diagnostics, Settings, About.

**Acceptance gate:** every visible link resolves through the registry; optional unavailable destinations display readiness or remain hidden according to policy; no duplicated menu markup remains authoritative.

## Pass 3 — Dashboard Foundation

**Goal:** make Dashboard answer “what does Codee know, what is running, and what needs attention?”

**Show:** project, repository, branch, framework/runtime, active plan/step, last verified artifact, AI status, free/local AI availability, MCP, Repository Host, Artifact Host, Browser state, manager readiness, failures, warnings, approvals, risks, recent work.

**Quick actions:** New Plan, Continue Plan, Analyze Repository, Ask Codee, Run Diagnostics, Open Last Artifact.

**Acceptance gate:** all cards derive from canonical registries/health providers, not duplicated UI state.

## Pass 4 — Capability Registry UI

**Goal:** expose the growing capability graph for humans and developers.

**Show:** capability ID, subsystem, readiness, owner, operation class, dependency, risk, execution availability.

**Examples:**
- `repository.search — READY`
- `repository.host.write — HOST_REQUIRED`
- `browser.snapshot — CONTRACT_ONLY`
- `workforce.ai.request — PROVIDER_REQUIRED`
- `mcp.tool.call — MCP_REQUIRED`

**Acceptance gate:** UI readiness equals runtime capability resolution for every registered capability.

---

# Phase II — Connections, Infrastructure and Preflight

## Pass 5 — Canonical Connection Registry

**Goal:** create one connection/health contract for AI providers, MCP, Repository Host, Artifact Host, local AI, and Browser runtime.

**States:** `CONNECTED`, `DEGRADED`, `MISSING`, `AUTH_FAILED`, `DISABLED`, `RATE_LIMITED`, `UNAVAILABLE`.

**Acceptance gate:** a global existing in memory does not equal “healthy”; each connector provides an actual probe/receipt.

## Pass 6 — Connections Workspace

**Goal:** build `Connections` as the operational front door for dependencies.

**Sections:** Free AI, Local AI, Premium/BYO, MCP, Repository Host, Artifact Verification Host, Browser.

**Actions:** Test, reconnect, configure, disable, view last success/error; secret fields always masked after entry.

**Acceptance gate:** missing dependencies are obvious before plan execution.

## Pass 7 — MCP Inspector

**Goal:** expose MCP servers, tools, resources, prompts, classifications and governance evidence.

**Show per tool:** `READ`, `VERIFY`, `EXECUTE`, `WRITE`, `DESTRUCTIVE`, `UNKNOWN`; local Codee risk floor; last call; approval; backup receipt; verification; blocked reason.

**Acceptance gate:** UNKNOWN mutation-capable tools are visibly blocked and cannot be executed from UI.

## Pass 8 — Repository Host + Artifact Host Operations

**Goal:** make privileged-host readiness visible and testable.

**Repository Host:** filesystem, command execution, backup domains, backup destination, write verification, rollback capability, last mutation.

**Artifact Host:** verifier status, byte/hash/size/ZIP/content-manifest verification, last receipt, held plans.

**Acceptance gate:** UI distinguishes “Repository Intelligence available” from “Repository Mutation unavailable.”

## Pass 9 — Plan Requirement Analyzer

**Goal:** statically derive infrastructure/capability requirements from a plan before dispatch.

**Output:** required conversation provider, repository READ/WRITE, backup domains, Artifact Host, MCP, managers, AI capabilities/privacy, browser capabilities, tests/commands.

**Acceptance gate:** a plan requiring a missing privileged dependency is identified before Step 1.

## Pass 10 — Production Plan Preflight

**Goal:** return `READY`, `READY_WITH_WARNINGS`, or `BLOCKED` before starting a run.

**Checks:** parse/limits, conversation/composer, repository, Artifact Host, Repository Host, MCP, AI models/quota/privacy/spend, Browser state, manager readiness, project identity.

**Acceptance gate:** no critical dependency is first discovered halfway through a run when it could have been known at start.

---

# Phase III — Artifacts, History and Observability

## Pass 11 — Artifact Workspace

**Goal:** make Artifact Protocol v2 inspectable.

**Hierarchy:** Plan → Run → Step → Artifact.

**Show:** artifact ID, filename, version, SHA-256, parent SHA-256, size, changed files, tests, verification receipt, timestamp, lineage, trusted/superseded state.

**States:** `VERIFIED`, `UNVERIFIED`, `RECEIPT_MISSING`, `CHAIN_BROKEN`, `PARENT_MISMATCH`, `SUPERSEDED`.

**Acceptance gate:** lineage breakage is visible and cannot be cosmetically reported as verified.

## Pass 12 — Durable Plan History

**Goal:** retain completed/failed/blocked/stopped/partial run history without exhausting Chrome storage.

**Store:** steps, artifact receipts, retries, failures, managers, AI calls, mutations, verification, duration and final state.

**Acceptance gate:** newest active/audit state remains complete; older completed plans compact safely according to retention policy with artifact receipts preserved.

## Pass 13 — Storage Health + Retention

**Goal:** make storage usage measurable and governable.

**Add:** storage used, plan count, artifact/audit counts, archive policy, compaction, diagnostic purge, export, safe cleanup.

**Acceptance gate:** cleanup cannot delete evidence required by active runs or artifact lineage.

## Pass 14 — Unified Events / Activity Inspector

**Goal:** provide one bounded observability stream for plans, AI, managers, repository reads, backups, mutations, MCP, browser, artifacts, verification and errors.

**Filters:** plan, run, step, manager, subsystem, severity, time.

**Acceptance gate:** activity records contain evidence identifiers but never secrets/full privileged payloads.

---

# Phase IV — Repository and Titan Product Surfaces

## Pass 15 — Repository Workspace

**Goal:** surface existing Repository Intelligence rather than hiding it behind internal calls.

**Tabs:** Overview, Explorer, Symbols, Architecture, Laravel, Database, Git, Impact, Tests, Problems.

**Acceptance gate:** all existing repository capabilities are either surfaced, deliberately internal, or explicitly classified—not silently unreachable.

## Pass 16 — Titan Zero Workspace

**Goal:** expose Titan-specific intelligence as a dedicated project surface.

**Show:** architecture, extensions, relationships, host compatibility, tenancy, routes, migrations, permissions, navigation, frontend surfaces, capability registries, integration health and Titan rules.

**Extension Health:** `HEALTHY`, `WARNING`, `BROKEN`, `UNWIRED`, `HOST_INCOMPATIBLE`, `MIGRATION_RISK`.

**Acceptance gate:** extension-owned routes/migrations/models/views remain first-class across both runtime analysis and UI.

## Pass 17 — Problems / Impact Intelligence

**Goal:** consolidate dead routes, missing classes, unwired services, schema/migration risk, navigation failures, changed-file impact and verification recommendations.

**Acceptance gate:** every problem has evidence IDs and an owning analyzer; no AI-only unsupported finding is displayed as deterministic fact.

---

# Phase V — Onboard AI Runtime and Providers

## Pass 18 — AI Request Identity, Audit and Cancellation

**Subplan sync:** resume Onboard AI at Pass 2.

**Goal:** durable `AI_REQUEST_ID + PLAN_ID + RUN_ID + STEP_ID + MANAGER_ID + CONTEXT_HASH`, bounded persistent AI audit, cancellation, stopped-plan invalidation and late-response rejection.

**Acceptance gate:** old asynchronous AI results cannot mutate or influence a newer/stopped step.

## Pass 19 — Credential Vault + Provider Security

**Goal:** implement `CodeeCredentialVault` before cloud provider rollout.

**Requirements:** provider-scoped credentials, masking, encryption-at-rest where technically available, validation, rotation/delete, no diagnostics/prompt/MCP/artifact leakage.

**Acceptance gate:** secret scans prove credentials do not appear in normal extension state or exports.

## Pass 20 — Local + Generic Provider Foundation

**Goal:** implement Ollama and generic OpenAI-compatible runtime first, with offline/local privacy support.

**Add:** local discovery, health, model discovery, streaming, structured output, tools/embeddings where supported, local-only routing.

**Acceptance gate:** Codee can perform onboard inference with internet disconnected when a local model exists.

## Pass 21 — Primary Free Cloud Providers

**Goal:** implement Gemini, OpenRouter, Groq and Mistral adapters behind the universal provider contract.

**Rules:** discover models/limits dynamically; never hard-code `provider = free`; normalize errors, tools, structured responses, streaming and usage.

**Acceptance gate:** each adapter passes contract tests and can disappear/degrade without breaking deterministic Codee.

## Pass 22 — Model Registry + Capability Probing

**Goal:** continuously refresh provider/model capabilities and lifecycle.

**Track:** free/paid state, pricing, context, reasoning, coding, tools, JSON Schema, vision, embeddings, files, caching, batch, rate limits, privacy, health, reliability.

**Acceptance gate:** stale documentation cannot override fresh capability receipts.

## Pass 23 — Free Router + Quota + Spend Governance

**Goal:** implement local-first/free-first policy.

**Add:** FreeQuotaLedger, `FREE ONLY`, daily/weekly/monthly/provider/model/plan/manager caps, cost estimation, reset tracking, 429 handling, failover, queue/concurrency/backoff.

**Acceptance gate:** `FREE ONLY` can never silently invoke a paid provider.

## Pass 24 — Additional Provider Expansion

**Goal:** add Grok/xAI, LM Studio, Cloudflare Workers AI, Cohere, NVIDIA NIM, Hugging Face and generic Anthropic-compatible provider.

**Lifecycle support:** `ACTIVE`, `DEGRADED`, `DEPRECATED`, `RETIRED`, `TEMPORARILY_UNAVAILABLE`, `CONFIGURATION_REQUIRED`, `PAID_ONLY`, `FREE_LIMITED`, `FREE`, `LOCAL`.

**Acceptance gate:** adding/removing providers requires adapters/registry metadata, not rewrites of managers.

---

# Phase VI — Intelligence and AI Workforce Product Surfaces

## Pass 25 — Intelligence Workspace

**Goal:** build Codee's “brain inspector.”

**Sections:** Brain Status, Project Understanding, Reasoning, Evidence, Contradictions, Recommendations, Verification, Project Knowledge, AI Activity.

**Acceptance gate:** AI findings visually distinguish deterministic evidence, AI inference and unresolved assumptions.

## Pass 26 — AI Workforce Workspace

**Goal:** expose all 14 managers.

**Per manager:** readiness, current/last task, model, calls, tools, evidence, confidence, recommendations, handoffs, cost, pending requests.

**Controls:** enable/disable, local-only, model preference, spend cap, autonomy level.

**Acceptance gate:** manager UI cannot raise authority beyond manager contract.

## Pass 27 — Context, Evidence, Memory and RAG

**Goal:** build `CodeeContextEngine`, governed project memory and repository semantic retrieval.

**Requirements:** relevance tiers, context budgeting, local-first embeddings, evidence IDs, memory candidate verification, prompt-injection boundary, privacy routing, context compression.

**Acceptance gate:** AI never directly promotes memory and retrieved text cannot redefine Codee system/security policy.

## Pass 28 — Confidence, Hallucination Verification and Council

**Goal:** derive confidence from evidence coverage, deterministic checks, verified outcomes and cross-model agreement.

**Add:** claim states `SUPPORTED`, `PARTIALLY_SUPPORTED`, `UNSUPPORTED`, `CONTRADICTED`, `UNVERIFIABLE`; selective multi-model council; model performance history.

**Acceptance gate:** high-risk unsupported claims cannot automatically become mutation proposals.

---

# Phase VII — Browser Engine Completion

## Pass 29 — Resume Browser Runtime Foundation

**Subplan sync:** resume Browser Engine at Pass 3 and continue its canonical Tab Registry, CDP Session Manager, stable refs and observation stack in the existing security-first order.

**Acceptance gate:** tab-ID reuse, origin changes, navigation and worker restart cannot preserve stale browser authority.

## Pass 30 — Browser Execution + Workspace

**Goal:** complete governed browser observation and interaction capabilities, then expose them visibly.

**Include:** accessibility snapshot, page Markdown, screenshots, navigation, CDP input, dialogs, console, network, React/CSS diagnostics, compose engine, bounded evaluate permission, audit history.

**Acceptance gate:** Chrome permissions are added only when the corresponding runtime gate is implemented and tested.

## Pass 31 — Browser AI Observation/Action Loop

**Goal:** connect onboard AI only after browser execution governance is mature.

**Loop:** Observe → AI interprets/proposes → Codee validates permission/capability → Browser Engine executes → new observation → Codee verifies outcome.

**Acceptance gate:** AI can request actions but cannot grant browser permission or call privileged browser implementation directly.

---

# Phase VIII — Diagnostics, Self-Healing and Production Certification

## Pass 32 — Production Certification + Self-Healing Completion

**Goal:** finish Codee as a certifiable, observable and self-auditing platform.

**Diagnostics matrix:** Plan Engine, Artifact Protocol/Host, Repository Intelligence/Host, MCP, Titan, Workforce, Provider Gateway, local AI, model registry, quota ledger, Browser Policy/Execution, storage, context/memory/indexes.

**Self-healing:** recovery alarms, orphaned bindings, stale tabs, provisional IDs, provider health/catalogue, browser grants, repository indexes, manager sessions, non-critical caches. Never heal by weakening security/evidence.

**Certification:** JS syntax, JSON, manifest references, imports, navigation routes, duplicate IDs, providers, managers, capabilities, permissions, dead/unreachable code, contract-only UI claims, version consistency, dependency availability, security sinks, source manifest, ZIP integrity.

**Dead/wiring classification:** `IMPLEMENTED_WIRED`, `IMPLEMENTED_UNREACHABLE`, `REGISTERED_NO_EXECUTION`, `UI_ONLY`, `CONTRACT_ONLY`, `DEPRECATED`, `DEAD`.

**Version invariant:** manifest version = package version = README current version = release metadata version.

**Acceptance gate:** `CODEE_FULL_VERIFY: PASS` plus adversarial authority/privacy/cost/browser/MCP/mutation/artifact tests and fresh extracted-ZIP verification.

---

# Cross-Track Release Rules

Each pass must:

1. Start from the previous verified cumulative ZIP.
2. Preserve the master `PLAN_ID` above.
3. Preserve subordinate Browser/AI PLAN_IDs when implementing their passes.
4. Deep-scan affected existing code before modification.
5. Add failing tests before production behavior changes.
6. Fix newly found defects in-scope rather than merely report them.
7. Run focused tests, the inherited full suite and pass-specific hostile/concurrency tests.
8. Produce a cumulative ZIP only after fresh extracted-package verification.
9. Report exact SHA-256, parent SHA-256, ZIP size and file delta.
10. Report master progress and subordinate track progress at the end of every implementation pass.

# Final Production State

At completion, Codee should operate as:

```text
                         CODEE
                           │
            ┌──────────────┴──────────────┐
            │                             │
   Deterministic Governance        AI Intelligence
            │                     CodeeProviderGateway
            │                             │
            │                Local / Free / Paid-BYO
            │                             │
            └──────────────┬──────────────┘
                           │
                Context / Evidence / Memory
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Repository            Browser             Titan
   Intelligence          Intelligence         Intelligence
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    AI Workforce
                    14 Managers
                           │
                Recommendations / Requests
                           │
                    CODEE GOVERNANCE
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
    Plans                 MCP             Repository Host
      │                    │                    │
      └────────────────────┼────────────────────┘
                           │
             Backup → Verify → Authorize
                    → Execute → Verify
                           │
                  Artifact Verification
```

**Sovereign rule:** AI proposes. Codee observes, checks, governs, executes and verifies.

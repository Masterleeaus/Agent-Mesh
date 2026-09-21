# Titan Code v2.11.9 — Install-Ready G3 Manager Consolidation

This package is the install-ready consolidation prepared from the verified Generation 2 canonical baseline. It adds stable canonical Library identity, idle-agent self-claim reconciliation, final-pass auto-rollover, structured-history preservation, lifecycle normalization, and selective promotion rebase. See `INSTALL.md` and `docs/MANAGER-CONTROL-PLANE-CONSOLIDATION.md`.

---

# Titan Code v2.11.9 — Unified Browser Intelligence + Agent Mesh Manager Plan — Pass 01: Streaming Inference Convergence

This cumulative advances the v2.11.8 Pass 06 baseline with real bounded incremental inference streaming. It preserves all prior release notes below.

> **Product name:** Titan Code. Legacy `Codee*` runtime/storage/protocol identifiers remain compatibility contracts and are intentionally not renamed in this pass.

# Titan Code v2.11.8 — Donor-First Browser Intelligence Pass 06: Inference RPC and Request Transport

Donor-first Browser Intelligence plan: 6/30 complete, 24 remaining.

Pass 6 adds a single governed inference RPC funnel over the existing shared `CodeeIntelligenceHost` and Pass 05 offscreen runtime. It preserves exact `requestId` / `sessionId` identity end-to-end, registers one shared browser-offscreen runtime for reuse across conversations, rejects mismatched responses, and prevents cross-session cancellation. The transport is advisory infrastructure only and grants no plan-advance, canonical-promotion, repository-mutation, shell, backup, Supervisor, Librarian, or durable-memory authority.

The implementation adapts the harvested Auto Browser RPC transport pattern instead of introducing a second Codee scheduler or message architecture. Real incremental token streaming and model adapters remain later passes; this pass transports the operation without claiming those later capabilities.

Previous baseline compatibility: **Donor-First Browser Intelligence Pass 05** (Offscreen Inference Runtime) and **Browser Intelligence Pass 04** (WebGPU Capability Detection) remain fully retained beneath this Pass 06 layer.

---

# Titan Code v2.11.6 — Donor-First Browser Intelligence Pass 05: Offscreen Inference Runtime

Donor-first Browser Intelligence plan: 5/30 complete, 25 remaining.

Pass 5 adds a governed MV3 offscreen runtime for browser-local intelligence work that genuinely needs an offscreen document. The implementation adapts the harvested Auto Browser v1.4.2 ref-counted lifecycle: concurrent requests share one document, the last request closes it, create/close races are treated idempotently, and there is deliberately no keepalive timer. Request/session identity is carried in the Codee intelligence envelope, and the offscreen document exposes only request/stream/embed/health/capability dispatch to a separately registered inference adapter; it does not gain plan-advance, browser-action, repository-mutation, shell, credential or artifact-verification authority.

The new runtime is loaded beside the existing `CodeeIntelligenceHost`; the manifest adds only Chrome's `offscreen` permission. No host permission is added.

Previous baseline compatibility: **Browser Intelligence Pass 04** (WebGPU Capability Detection) remains fully retained beneath this donor-first Pass 05 layer.

**Master plan progress: 10/32 complete, 22 remaining.**

Pass 10 consumes the canonical `codee.plan.requirements.v1` snapshot and evaluates live execution readiness before Step 1. The read-only `CodeeProductionPlanPreflight` emits `READY`, `READY_WITH_WARNINGS`, or `BLOCKED` from bounded evidence covering exact conversation/composer binding, AI/provider policy, Repository READ/WRITE/command/destructive host readiness, backup domains, Artifact Host receipt/content-manifest capability, MCP, Browser Control capabilities, Workforce readiness and project identity. `START_PLAN` re-evaluates the preflight and refuses Step 1 dispatch while blockers remain. The Runner exposes a manual **Run Production Preflight** control and renders blocker/warning codes. The preflight cannot mutate, grant capabilities, override blockers, verify completion or advance a plan.

# Codee v2.10.0 — Platform Pass 9

The Plan Requirement Analyzer now deterministically derives each plan's conversation, AI/provider, Repository READ/WRITE/command, backup-domain, Artifact Host, MCP, Browser, privacy, cost and verification requirements before Step 1 can dispatch. The saved `codee.plan.requirements.v1` snapshot contains bounded requirement metadata only; it does not echo plan text, secrets, credentials, or mutation payloads and cannot grant capabilities, mark the plan ready, mutate, or advance execution.

The Runner adds an **Analyze Requirements** preview, while the service worker independently re-derives and persists requirements during `SAVE_PLAN`, so bypassing the UI cannot skip analysis. Signature-v2 plans explicitly require the Artifact Verification Host/receipt path, repository mutations require verified backup domains and post-write verification, and browser/MCP/provider requirements are expressed as canonical capability IDs for Pass 10 preflight.

Master progress is **9/32 complete, 23 remaining**. The next master implementation pass is **Pass 10 — Production Plan Preflight**.

# Codee v2.9.0 — Platform Pass 8

Repository Host + Artifact Host Operations is now available as a read-only Infrastructure surface. It explicitly separates Repository Intelligence availability from privileged Repository Mutation readiness, reports filesystem/command/backup/write-verification/rollback capabilities, and exposes independent artifact verifier checks, latest accepted receipt, and held-plan state without performing mutations from the UI.

# 🤖 CODEE v2.8.3 - Deep Scan Recovery Remediation

## v2.8.3 Deep Scan Recovery Remediation

This cumulative remediation follows a full recovery-path deep scan after v2.8.2 could repeatedly reload a ChatGPT conversation before the SPA and composer had time to settle. The root cause was not one selector: several recovery layers could independently request reloads, passive diagnostics could reload the target, the one-minute sweep recovered composers even while a plan was waiting for an artifact, and legacy preferences kept automatic targeted reload enabled.

v2.8.3 separates content-transport recovery from composer availability. A missing composer now receives bounded wake/focus/hydration retries and normal delivery backoff but never causes a reload by itself. Automatic sweeps are plan-state aware: `pending_send` uses one atomic page-snapshot-before-send path, while `awaiting_artifact`, `awaiting_zip`, and blocked states perform non-reloading artifact scans. The five-minute nudger and Diagnostics page are also non-reloading.

Targeted reload is now opt-in under recovery policy v2 and legacy stored defaults migrate safely to OFF. When explicitly enabled, reload is limited to genuine content-script transport failure and protected by a five-minute per-tab cooldown plus an in-flight circuit breaker. `CONTENT_READY` cannot start a nested dispatch during watchdog reload. Current ChatGPT composer coverage retains `#prompt-textarea` and `[data-testid="prompt-textarea"]` and adds the specific `textarea[name="prompt-textarea"]` fallback without introducing unsafe generic contenteditable matching. Rapid identical diagnostics are coalesced with a repeat count.

Additional deep-scan fixes include the stale service-worker live-view registry (Connections and MCP are now included) and a duplicate Dashboard refresh callback. No Chrome permissions are added, strict artifact verification and exactly-once step identity remain unchanged, and automatic recovery no longer destroys an in-flight provider response merely because the composer is temporarily absent.

**Governed development intelligence with resilient off-screen Plan Runner recovery, live MCP Inspector, operational Connections, deterministic plan authority and independently verified artifacts.**

## v2.8.2 Background Window Composer Recovery Hotfix

This cumulative hotfix addresses the remaining off-screen Plan Runner stall seen when a bound ChatGPT conversation was runnable but not on the currently focused browser screen. Chrome distinguishes a tab being active in its own window from that window actually being focused. Codee v2.8.1 activated the bound tab but could therefore still probe a background window before ChatGPT had hydrated its composer. Chrome could also transiently reject tab activation with `Tabs cannot be edited right now (user may be dragging a tab)`, causing recovery to abort early.

v2.8.2 now temporarily focuses the exact bound browser window as well as the bound tab when recovery requires it, retries Chrome's transient tab-edit lock with bounded backoff, waits for ChatGPT SPA composer hydration before declaring `composer-not-found`, waits for the content-script bridge after targeted reload, and restores the user's previously active tab/window after the operation. ChatGPT-specific composer coverage is expanded safely to `#prompt-textarea` plus `[data-testid="prompt-textarea"]`, with current submit identifiers, while the inherited protection against generic `[contenteditable]` fallbacks remains enforced.

The hotfix also resolves a recovery revision race: a targeted reload can generate a fresh `CONTENT_READY` while the original dispatch remains in flight. A positive provider submission acknowledgement is now committed atomically against the latest stored state only when PLAN_ID, step index, STEP_ID and STEP_TOKEN still match. Harmless revision drift can no longer discard a real submission, while changed step/token identity still fails closed.

No new Chrome permissions are added. Strict Artifact Signature Protocol v2, independent artifact receipts, exact conversation binding and exactly-once step-token protections remain authoritative.

Master progress is **7/32 complete, 25 remaining**. The next master implementation pass is **Pass 8 — Repository Host + Artifact Host Operations**.

**Governed development intelligence with a live MCP Inspector, operational Connections workspace, probe-backed health, runtime-derived capability readiness, deterministic plan authority, independently verified artifacts, Titan MCP 1.5, repository intelligence and AI Workforce.**

## v2.8.1 Plan Runner Recovery Convergence

This cumulative hotfix restores the stronger Plan Runner recovery/composer-watchdog behavior from the v2.0.20 recovery branch without replacing the v2.8.0 Titan MCP 1.5, Dashboard, Capability Registry, Connections, Repository Intelligence, Workforce or strict artifact-verification architecture.

The primary off-screen stall was traced to background plan recovery sending content messages directly to the bound conversation tab without first making a frozen/discarded tab runnable or verifying that its provider composer had mounted. A failed `GET_PAGE_STATE`, `CHECK_FOR_ZIP` or `SEND_PROMPT` therefore entered retry/backoff and often recovered only when the user manually foregrounded that conversation. v2.8.1 wraps those operations in an exact-target recovery transport: wake/focus the bound tab when required, wait for discarded tabs to reload, probe the composer, use a targeted reload only when the provider is not generating, revalidate conversation identity immediately before submit, then restore the user's previously active tab.

The convergence also restores robust `Step`/`Task`/`Pass` parsing (`Pass N of M`, `Pass N/M`, nested bullets, fenced code and large numbered plans), adds a deterministic **Generate 10-Pass Debugging Plan** control, per-plan Debugging Plan mode, configurable one-minute recovery sweep, optional five-minute `next` nudger that never overwrites drafts or advances Codee state, background/composer watchdog settings and richer frozen/discarded-tab diagnostics. No `scripting` permission or content-script reinjection authority is added.

Strict Artifact Signature Protocol v2 remains authoritative: visible ZIP candidates are diagnostic/read-only evidence and cannot advance a signature-v2 plan without the accepted independent artifact verification receipt. Exactly-once step-token and conversation-binding protections remain in force.

Master progress is **7/32 complete, 25 remaining**. The next master implementation pass is **Pass 8 — Repository Host + Artifact Host Operations**.

## v2.8.0 Production Platform Completion — Master Pass 7/32

Codee now exposes **Infrastructure → MCP** as a live read-only inspector over the canonical Titan MCP 1.5 runtime. The page shows configured servers, protocol/server identity, governed tools, sanitized input schemas, prompts, explicit resource availability, pending mutation approvals and bounded mutation receipts. It does not create another MCP transport, tool catalogue or mutation authority.

Tool classification is projected from the existing `CodeeMcpGovernanceGateway`, so Titan tool-policy metadata is trusted only for `titan_*` tools and Codee's local classification floor can only maintain or increase risk. Display operation classes include `READ`, `VERIFY`, `EXECUTE`, `WRITE`, `DESTRUCTIVE` and `UNKNOWN`. Unknown ambiguous tools are blocked; clearly dangerous third-party names are escalated locally rather than trusting permissive server hints. Mutating tools remain non-executable from the inspector and show their approval/backup/ticket requirements instead.

The inspector strips connection credential-state metadata, schema default/example values and material approval previews. Pending approvals expose only bounded identity, exact-argument hash/ticket binding, targets and verified backup coverage. Mutation receipts expose bounded verification/audit evidence. Titan MCP resources remain explicitly `UNAVAILABLE` because the current Titan runtime intentionally does not expose resource enumeration/read capability; Codee does not fabricate resource rows. No new Chrome permissions are introduced.

Master Platform Completion progress: **7/32 complete, 25 remaining**. Browser Engine remains **2/22**. Onboard AI remains **1/32**.

## v2.7.0 Production Platform Completion — Master Pass 6/32

Codee now exposes the canonical connection registry as a live **Connections** workspace under Infrastructure. It presents seven operational sections: Free AI, Local AI, Premium / BYO AI, Titan MCP, Repository Host, Artifact Verification Host and Browser. Each section shows the canonical state, last probe time, bounded last-error reason and sanitized provider rows where available.

The workspace supports explicit **Test** and **Reconnect** operations by forcing fresh canonical probes rather than trusting cached object presence. **Configure** routes only to an existing subsystem-owned trusted surface (currently Titan MCP settings). **Disable** is shown but remains unavailable when the owning subsystem has no canonical disable control; Codee does not invent a second configuration authority merely to make a button appear functional. Unsupported privileged actions therefore fail closed and explain their ownership boundary.

No secret value, token metadata, credential state, raw host payload or artifact receipt ID is rendered in the Connections workspace. Free/local/premium provider classification is derived only from bounded public provider lifecycle/transport metadata. No new Chrome permissions were introduced.

Master Platform Completion progress: **6/32 complete, 26 remaining**. Browser Engine remains **2/22**. Onboard AI remains **1/32**.

## v2.6.0 Production Platform Completion — Master Pass 5/32

Codee now has one canonical `CodeeConnectionRegistry` for AI providers, local AI, Titan MCP, Repository Host, Artifact Verification Host and Browser runtime. The registry uses the master states `CONNECTED`, `DEGRADED`, `MISSING`, `AUTH_FAILED`, `DISABLED`, `RATE_LIMITED` and `UNAVAILABLE`. A registered object or loaded global is never treated as healthy by itself.

Provider adapters are actively checked through their provider-contract `health()` probe; enabled Titan MCP connections are actively checked through `CodeeMcpRuntime.health()`. Repository and Artifact hosts require an explicit host `health()` result or trusted accepted artifact-verification receipt evidence before becoming `CONNECTED`. Browser remains `UNAVAILABLE` while execution is contract-only; a future executable browser runtime will still require probe evidence rather than registration alone. Probe output is normalized to bounded state only—tokens, credentials, raw host payloads and receipt IDs are not exposed by the registry.

The service worker exposes `GET_CONNECTION_REGISTRY`, caches probes briefly to avoid aggressive rechecking, and the Dashboard now derives infrastructure/AI health from this canonical registry. Local-only AI remains fully valid: a connected local provider makes AI ready even if cloud providers are missing. No new Chrome permissions are introduced.

Master Platform Completion progress: **5/32 complete, 27 remaining**. Browser Engine remains **2/22**. Onboard AI remains **1/32**.

## v2.5.0 Production Platform Completion — Master Pass 4/32

Codee now exposes its canonical capability graph inside Diagnostics & Recovery without creating a second capability authority or changing the Pass 2 sidebar information architecture. The view is derived from `CodeeCapabilityRegistry` plus current Provider Gateway, Browser Engine, Repository/Repository Host, AI Workforce and Titan MCP runtime state.

Each capability reports stable ID, subsystem, owner, operation class, risk, dependencies, readiness and whether execution is actually available. Conservative readiness states include `READY`, `CONTRACT_ONLY`, `HOST_REQUIRED`, `PROVIDER_REQUIRED`, `MCP_REQUIRED`, `CONNECTION_REQUIRED`, `DEPENDENCY_MISSING`, `DISABLED` and `UNAVAILABLE`. Browser contracts remain non-executable until Browser Engine implementation is live; repository host mutation remains gated until the privileged host capability exists; MCP tool calls remain gated until runtime/connection requirements are satisfied; Workforce AI requests remain provider-gated.

The Capability Registry UI includes search, readiness and subsystem filters plus live registered/executable/gated/contract-only totals. It copies only bounded non-secret capability metadata and never grants plan, browser, mutation, backup, credential, spending or artifact-verification authority. No new Chrome permissions are introduced.

Master Platform Completion progress: **4/32 complete, 28 remaining**. Browser Engine remains **2/22**. Onboard AI remains **1/32**.

## v2.4.0 Production Platform Completion — Master Pass 3/32

Codee now opens on a canonical Dashboard for new installs while preserving remembered pages for existing users. The Dashboard is a read-only aggregation layer: it does not create a second state authority. Project/repository/branch/runtime information comes from existing Repository and Titan analysis; active plan state comes from the canonical Plan Engine; artifacts come from accepted artifact history and independent verification receipts; AI comes from `CodeeProviderGateway`; infrastructure state comes from Titan MCP 1.5, Repository Host, Artifact Host and Browser Engine status; Workforce readiness comes from the existing 14-manager runtime.

The Dashboard exposes Project, Active Plan, Last Artifact, AI, Infrastructure, AI Workforce and Needs Attention cards plus quick actions for New Plan, Continue Plan, Analyze Repository, Ask Codee, Run Diagnostics and Open Last Artifact. Quick actions route into existing governed Codee surfaces rather than bypassing plan, mutation or verification authority. Pending MCP approvals, artifact verification holds, diagnostic failures/warnings and unavailable privileged hosts are surfaced as bounded attention items.

Navigation now marks Dashboard `AVAILABLE`. Registry failure still fails closed to Runner. No new Chrome permissions are introduced. The dashboard status contract strips credential metadata and retains graceful degradation when AI, MCP or privileged hosts are unavailable.

Master Platform Completion progress: **3/32 complete, 29 remaining**. Browser Engine remains **2/22**. Onboard AI remains **1/32**.

## v2.3.4 Titan MCP 1.5 Convergence

Codee now consumes Titan MCP 1.5 as a trusted governed coding runtime without duplicating Titan server responsibilities. Exact mutation arguments are preserved across the Codee capability boundary and sent with standard MCP `tools/call.params.arguments`; evidence redaction is applied only to remote evidence/approval previews, never to the mutation payload itself. Titan's machine-readable client/tool policy drives READ/WRITE/DESTRUCTIVE/COORDINATE classification for `titan_*` tools, while unknown third-party tools still fail closed.

Ticketable writes use `titan_mutation_prepare` → independent Codee backup verification → bounded human approval evidence → `titan_mutation_commit(ticketId)` → client readback or server commit evidence → Codee receipt. The approved network transport now accepts JSON or SSE Streamable HTTP responses, keeps large mutation traffic bounded, and advertises both response types. Settings expose the exact Codee Chrome origin, tool discovery, connection removal, ticket evidence and mutation receipts.

Compatibility: **Titan MCP 1.5+ preferred**. The v2.3.3 verified-prewrite fallback remains for older compatible Titan MCP servers.

## v2.3.1 Production Platform Completion — Master Pass 2/32

Codee now exposes its complete product information architecture through the canonical `CodeeNavigationRegistry`: Workspace, Intelligence, Infrastructure, Knowledge and System. The registry owns 19 page destinations; existing operational pages remain interactive, future workspaces are visibly `COMING_NEXT`, and Browser remains honestly `CONTRACT_ONLY`. Disabled destinations cannot be opened as if they were implemented, and malformed navigation still fails closed to Runner. Static sidebar markup does not own canonical menu links.

Master Platform Completion progress: **2/32**. Browser Engine remains **2/22**. Onboard AI remains **1/32**.

## v2.3.0 Production Platform Completion — Master Pass 1/32

Codee established one canonical self-validating `CodeeNavigationRegistry` and readiness resolver. The service worker owns navigation definitions; the sidebar renders them dynamically instead of owning hard-coded buttons. Navigation records declare stable IDs, parent/group relationships, order, destination, context, feature/capability/dependency requirements and readiness. Malformed navigation fails closed to a Runner-only fallback. Browser is visible as `CONTRACT_ONLY` and cannot be opened as if execution were operational.


## v2.2.1 Onboard AI — Brain Foundation (Pass 1/32)

Codee now contains the provider-independent onboard-AI foundation specified by the Codee Onboard AI requirements: a single `CodeeProviderGateway`, normalized `codee.ai.request.v1` / `codee.ai.response.v1` contracts, universal provider contract, independent AI provider/model registries, bounded AI audit evidence, capability/privacy/cost eligibility floors, and Workforce compatibility through the existing advisory-only request path.

This pass deliberately enables **no live model transport** and stores **no provider credentials**. No provider adapter may gain plan, mutation, browser, artifact, backup, spend-policy or memory-promotion authority. `SECRET`/`LOCAL_ONLY` requests are local-only and `FREE_ONLY` cannot select paid lifecycle classes even before the later routing/quota engine is installed.

The Browser Control Engine remains at **Pass 2/22**. Browser AI will be connected only after browser execution governance matures.

## v2.2.0 Browser Control Engine — Pass 2

Pass 1 established forty canonical `browser.*` capability contracts. Pass 2 adds the browser policy and permission model that future CDP/browser execution must pass through: explicit per-tab `disconnected -> connected-read -> connected-interactive -> developer-evaluate-enabled` states, exact-origin binding, restricted-page rejection, temporary bounded grants, extension-owned `chrome.storage.session` persistence, bounded audit evidence and an explicit developer-JavaScript opt-in.

The service worker now exposes policy connect/grant/revoke/disconnect and read-only authorization/status inspection. All browser capabilities remain `contract_only`; execution is still disabled and Codee still does not request `debugger`, `scripting`, `activeTab`, `webRequest`, `webNavigation`, or `<all_urls>`. Pass 3 owns the canonical Tab Registry.

## v2.1.6 Orchestrator Trust-Boundary Hardening

This cumulative release rebases the deeper adversarial audit onto the already integrated Titan Zero, Repository/Coding, and Managers/AI Workforce runtime. It adds five-class command governance (`READ / VERIFY / EXECUTE / WRITE / DESTRUCTIVE`), effect-complete backup coverage, Codee-local MCP risk/effect floors, strict artifact metadata + verified ZIP content-manifest receipts, positive provider user-message acknowledgement, extension-owned durable submission receipts, retry budgets/backoff, conversation-level single-plan ownership, storage compaction/health, per-step/prompt budgets, filter-before-limit repository snapshots, pre-serialization MCP bounds, a provider registry foundation, current extension-first-class Titan scope, and one canonical `npm test` release verifier with a SHA-256 source manifest.

New v2.1.6 plans use `artifactValidationMode: strict_v216`; older saved plans keep their prior compatibility mode.

## How It Works

1. **Open a ChatGPT or Claude conversation** (or several)

2. **Paste your plan or load a local `.md` / `.txt` file** into the Codee sidebar
   ```
   1) Fix authentication bug
   2) Add email validation
   3) Add unit tests
   4) Deploy to staging
   ```

3. **Use the current conversation automatically** or choose another open conversation by name

4. **Click Start Plan** → Codee validates and starts

5. **Codee sends Step 1 immediately** to that tab

6. **You walk away** → Codee takes over:
   - Watches assistant replies for a matching `CODEE_ARTIFACT ... CODEE_ARTIFACT_READY` footer
   - Verifies the active `PLAN_ID`, `RUN_ID`, `STEP_ID`, `STEP_TOKEN`, step number, parent SHA, status and reported SHA-256
   - For new v2.1.6 plans, requires an independent host receipt proving the actual ZIP exists, finished downloading, matches SHA-256/size, passes ZIP integrity, and verifies a hashed ZIP content manifest
   - Advances only after both the signed footer and required artifact receipt are accepted
   - Sends the next step to the same conversation automatically
   - Uses a one-minute recovery sweep if an event or provider acknowledgement is missed

7. **Repeat steps 2-6 on other tabs** if desired

8. **Done!** → Codee retains plan progress, recent versions and artifact history in extension storage

---

## Installation

1. Extract the ZIP
2. Go to `chrome://extensions/`
3. Enable "Developer Mode" (top right)
4. Click "Load unpacked"
5. Select `codee-clean` folder
6. Done!

---

## Features

✅ Paste or locally import `.md` / `.txt` plans  
✅ Auto-sends steps to ChatGPT or Claude  
✅ Uses deterministic CODEE artifact signatures for step completion  
✅ Tracks the latest 5 reported artifact versions per plan  
✅ Polls every minute  
✅ Works with ChatGPT & Claude  
✅ Chrome sidebar UI with current-conversation targeting  
✅ Canonical Dashboard plus registry-owned navigation for Runner, Active Plans, Prompts, Skills, Settings, Diagnostics, About and future governed workspaces  
✅ Real-time progress tracking  
✅ Titan Zero host-development intelligence integrated into existing Codee surfaces  
✅ 35 Titan Zero prompts and 38 Titan Zero skills available in the existing libraries  
✅ 14 Titan Zero specialist profiles retained in the canonical capability registry  
✅ Read-only Titan Zero schema, migration, tenancy, architecture, route, frontend, navigation, impact, and test-matrix analysis  
✅ Titan Zero diagnostics and locked safety settings inside the existing Settings/Diagnostics pages  
✅ Repository & Coding Intelligence Mega Pack integrated into the canonical capability registry  
✅ 28 repository/MCP capabilities, 24 repository prompts, 28 skills and 10 specialist profiles  
✅ `app/Extensions/**` is first-class repository/Titan evidence while secret/generated/dependency paths remain governed  
✅ Diff, impact, change-set, rollback planning, targeted tests, Git/log/error, Laravel route/migration and dependency intelligence  
✅ Privileged repository writes/commands are host-owned and fail closed unless the mandatory backup/verification/audit contract is available  
✅ MCP is consumed through the separately owned Codee MCP runtime; this pack does not create a second MCP transport or plan engine  
✅ Managers & AI Workforce Mega Pack integrated into the canonical capability registry  
✅ 14 governed specialist managers, 17 workforce capabilities, 30 prompts, 34 skills and 14 profiles  
✅ Manager preflight, evidence requests, readiness, handoffs and create-only plan drafting in the existing Runner/Plans surfaces  
✅ Documentation and Governance managers have explicit routing; Laravel/runtime/extension/security/testing/release/etc. route through bounded task classification  
✅ Manager tool/AI/mutation requests require registered manager attribution and are redacted/bounded at the workforce boundary  
✅ AI provider results are advisory-only evidence and cannot execute themselves or advance plans  
✅ Workforce failures are fail-open for Codee plan save/start; the deterministic runner remains authoritative  
✅ Governed manager mutation requests reuse the existing repository/Titan privileged pipeline: no verified backup = no write  
✅ Verified Artifact Receipt gate for new plans; footer self-certification alone cannot advance a new v2.1.5 run  
✅ Governed MCP gateway classifies trusted Titan tools READ/WRITE/DESTRUCTIVE/COORDINATE from Titan 1.5 policy metadata while unknown third-party tools fail closed  
✅ Titan MCP 1.5 mutations use sealed two-phase tickets with independently verified pre-approval backup evidence, human approval, exact-argument commit, post-write verification and durable Codee receipts  
✅ MCP context gathering permits tool calls only when the discovered tool is READ-only  
✅ Provisional ChatGPT/Claude new-chat identities support safe orphan recovery and one-way promotion to structured conversation IDs  

---

## Files

- `manifest.json` - Extension config
- `src/sidebar/sidebar.html/css/js` - Plan input & progress UI
- `src/lib/service-worker.js` - Orchestration & polling
- `src/content-script.js` - ChatGPT/Claude page interaction and artifact detection

---

## That's It!

Focused, hands-free AI plan orchestration with explicit recovery and verification state.


## v2.1.5 Trust-Boundary Hardening

- New plans use `artifactVerificationMode: receipt_required`; a valid CODEE footer cannot advance until a trusted host returns a byte-level artifact verification receipt.
- Artifact receipts bind the exact ZIP filename, actual SHA-256, actual byte size, completed-download state, local artifact path, ZIP-integrity result and durable receipt ID.
- `mcp.tool.call` now routes through Codee's local governance gateway. Unknown tool classifications are denied.
- READ MCP tools remain direct evidence calls; WRITE/EXECUTE/DESTRUCTIVE tools require backup, backup verification, approval, execution verification, audit and rollback metadata.
- Tool calls made through the MCP context broker are READ-only.
- ChatGPT/Claude root/new-chat pages receive page-session provisional identities and promote one-way to structured conversation IDs when the provider creates them.
- Diagnostics reports artifact verifier connection/receipt state and provisional conversation identity.

See `docs/trust-boundaries/v2.1.5-trust-boundary-hardening.md` for host contracts.

## v2.0.1 Sidebar Fix

- Added the required `sidePanel` permission.
- Wired the extension toolbar action to open/toggle the Codee side panel.
- Manifest V3 service-worker inactivity is expected; Chrome wakes the worker for extension events.

## v2.0.2 Sidebar + MV3 Lifecycle Fix

- Keeps the required `sidePanel` permission and toolbar `openPanelOnActionClick` behavior.
- Does not call `chrome.sidePanel.open()` from service-worker startup code.
- Guards Side Panel API availability so the worker reports a clear error instead of crashing.
- Handles `Extension context invalidated` without an uncaught exception.
- Stops the periodic ZIP polling timer after an unpacked extension reload invalidates the page's old content script.
- Deduplicates ZIP versions within the content script so one visible ZIP is not reported repeatedly.
- Persists ZIP/version history in `chrome.storage.local` so normal Manifest V3 worker sleep/wake cycles do not erase it.
- Ignores already-processed ZIP versions after a page reload, preventing accidental double advancement.

### Important after updating an unpacked build

After clicking **Reload** on `chrome://extensions/`, refresh any ChatGPT or Claude tabs that were already open. Chrome cannot retrofit the newly loaded content script into an old page context; refreshing the page attaches the current Codee content script.

## v2.0.3 Conversation Targeting + Plan File Import

- Defaults new plans to the currently active ChatGPT or Claude conversation when the sidebar is opened on one.
- Labels targets by the browser conversation title instead of exposing Chrome tab numbers.
- Keeps other open ChatGPT/Claude conversations selectable by name.
- Refreshes target names when conversation tabs are activated, renamed, navigated, or closed.
- Keeps the plan composer visible while other plans are active, so another plan can be started without navigating away.
- Adds local `.md` and `.txt` plan import through a file picker or drag-and-drop.
- Loads imported plan text locally into the editable plan box for review before execution; no external plan-file upload is required.
- Parses `Step N` headings first, then numbered steps, then Markdown task-list/bullet steps, with a plain-line fallback.
- Persists conversation title/provider metadata with each active plan so progress cards remain readable across sidebar/service-worker lifecycle changes.
- Expands service-worker ZIP polling to both ChatGPT and Claude tabs.
- Renders user plan/version text with DOM text nodes rather than `innerHTML`.


## v2.0.4 Delivery-Safe Step Recovery

- Adds an explicit `pending_send → awaiting_zip → next step` delivery state machine.
- A ZIP can advance a plan only after the current step has been positively acknowledged by the target conversation content script.
- Baselines ZIP versions already visible in the conversation before sending/retrying a step, preventing old artifacts from completing a new step.
- When a tab cannot receive a prompt, the current step remains pending instead of being treated as sent.
- After a conversation reload, Codee automatically retries the same pending step rather than skipping forward.
- Adds bounded post-load readiness retries for ChatGPT/Claude pages whose composer mounts after `document_end`.
- `SEND_PROMPT` now reports failure when the page composer is unavailable instead of returning a false `{ ok: true }` acknowledgement.
- Later-step delivery failures use the same recovery path, so a failed Step N send cannot allow unrelated ZIPs to advance to Step N+1.
- The final plan is marked complete only after the final step's ZIP is detected, not merely after the final prompt is sent.
- Sidebar plan starts now route through the service-worker orchestration state machine instead of bypassing it with a direct tab message.
- Existing active v2.0.3 plan state is migration-held because its delivery history is unknowable; stop that legacy active plan and restart from the source Markdown instead of risking an incorrect resume.

## v2.0.5

- Standardizes periodic ZIP checks to once per minute in both the in-page content scanner and the service-worker cross-tab sweep.
- Keeps event-driven readiness, delivery acknowledgement, and reload recovery immediate; only periodic fallback polling changed.


## v2.0.8 Acknowledged Artifact Progression + Automatic Pending Retry

- Canonical artifact detection now uses an asynchronous worker acknowledgement; a signature is not marked consumed by the content script until the service worker confirms processing.
- `ARTIFACT_DETECTED` and legacy `ZIP_DETECTED` message handlers keep the Chrome message channel open until processing finishes, preventing fire-and-forget progression.
- Provider message selectors now include ChatGPT assistant-role nodes, with a whole-page canonical-signature fallback so DOM changes cannot hide a valid `CODEE_ARTIFACT` footer.
- Rapid DOM mutations are protected by in-flight artifact/version deduplication; failed processing becomes retryable rather than permanently suppressed.
- Prompt delivery acknowledgement now verifies that ChatGPT/Claude actually accepted submission instead of treating text insertion as a successful send.
- The one-minute recovery sweep automatically retries plans in `pending_send`, so a Step 2 send that races the provider composer no longer requires a manual reload.
- Existing v2.0.7 signature-v2 run state remains compatible. Refreshing a stuck conversation lets Codee reconcile an already-rendered matching footer and continue the same run.


## v2.0.6 Reload Reconciliation + Dark Theme

- Fixes the one-minute polling race where Step 1 could finish, the page could be refreshed before the next poll, and the completed ZIP would be swallowed into the reload baseline instead of advancing the plan.
- During `awaiting_zip`, a fresh content-script readiness handshake now reconciles one ZIP version that was not known when the current step was dispatched.
- During `pending_send`, reload-visible ZIPs remain baseline-only and cannot advance the unsent step.
- The next step is still sent only through the delivery-safe service-worker transaction and must be positively acknowledged by the conversation content script.
- Keeps both periodic fallback checks at one minute.
- Converts the sidebar to a dark theme using centralized CSS theme tokens for backgrounds, surfaces, borders, text, muted text, accents, warnings, success, and danger states.
- Declares `color-scheme: dark` so native form controls and browser-rendered UI match the sidebar.


## CODEE Artifact Signature Protocol v2

New plans started in v2.0.7 and later use the canonical `CODEE_ARTIFACT` / `CODEE_ARTIFACT_READY` footer as the primary completion handshake. Each dispatched step receives a unique `RUN_ID`, stable `STEP_ID`, and unique `STEP_TOKEN`; Codee appends the required footer contract to the prompt and advances only when the returned signature matches the active run/step/token, reports `STATUS: completed`, has `NEXT_ACTION: advance`, contains a valid final ZIP SHA-256, and reports passing verification. Consumed SHA-256 values are persisted to prevent duplicate advancement. For cumulative chains, the previous artifact SHA becomes the required `PARENT_SHA256` for the next step.

ZIP/version text detection remains only for legacy plans created before signature-v2. New v2.0.7 plans never advance from a filename/version match alone. Content scanning is event-driven with a one-minute fallback.


## v2.0.9 Deep-Scan Hardening

- Serializes plan-state writes so simultaneous provider tabs cannot clobber each other in `chrome.storage.local`.
- Serializes signed-artifact processing by logical plan step/token so multiple completion candidates cannot double-advance a step.
- Keeps `STEP_TOKEN` stable when retrying the same logical step and reconciles an already-visible matching artifact before resending.
- Treats artifact deduplication as run/step/token-specific rather than globally rejecting the same SHA-256 on a later valid step.
- Makes transient `not-awaiting-artifact` results retryable instead of permanently suppressing the footer in the content script.
- Always supplements provider message selectors with whole-page CODEE-signature scanning so a newer footer cannot be hidden by partial DOM selector coverage.
- Waits for the page artifact scan to settle before the one-minute recovery sweep retries a pending prompt.
- Hardens provider submission acknowledgement when ChatGPT/Claude replace the composer node after a successful send.
- Blocks dispatch if a saved structured conversation tab has navigated to a different conversation, while allowing provisional new-chat targets to promote to a structured conversation identity.
- Routes plan save/stop operations through the service worker, prevents active-plan overwrite, and prevents an in-flight send from resurrecting a stopped plan.
- Wires `STATUS: blocked|failed|partial` and `NEXT_ACTION: retry|hold|needs_user` into plan state instead of silently ignoring non-completed canonical results.
- Preserves nested Markdown list details under their top-level Codee step instead of creating fake extra steps.
- Ignores `Step N`, `Task N`, numbered-list, and bullet markers inside fenced Markdown code blocks while preserving the fenced content inside its parent step.
- Rebinds an orphaned active plan to a reopened ChatGPT/Claude tab when the structured conversation identity matches and the original tab no longer exists; never steals the plan from a still-live duplicate tab.
- Avoids empty `chrome.storage.local` writes on ordinary conversation readiness handshakes when no plan is bound.
- Extends the dispatched CODEE completion contract so `partial|failed|blocked` results can explicitly request `retry|hold|needs_user` without fabricating successful verification.
- Corrects completed-plan progress to 100%.
- Removes the unused `downloads` permission and stale documentation that claimed automatic ZIP downloading/archiving.


## v2.0.10 Deep Reliability + Corruption Hardening

- Expands CODEE artifact detection deduplication keys to include all validation-relevant signature fields, so a corrected footer is not suppressed merely because an earlier invalid footer used the same SHA/step token.
- Parses numeric CODEE fields strictly instead of accepting trailing garbage through permissive integer conversion.
- Allows a later valid completed footer to recover a previously blocked step while preserving run/step/token identity checks.
- Prevents provisional plans from crossing AI providers and strengthens unsupported-navigation guards.
- Holds future plan-state schemas intact rather than downgrading data written by a newer Codee build.
- Refuses ambiguous orphan-plan rebinds when multiple saved plans claim the same structured conversation identity.
- Adds state-revision compare-and-swap guards so stale async work cannot overwrite, recreate, or resurrect newer/stopped plan state.
- Repairs the recovery alarm only when missing or on the wrong cadence instead of resetting a valid one-minute alarm on every worker wake; startup/install hooks re-ensure it.
- Persists/reconstructs accepted step-token evidence so a lost worker acknowledgement or tab reopen does not duplicate an expensive AI step.
- Coalesces concurrent content scans and bounds long-lived signature/version/token caches.
- Prefers a later valid completed footer over an older blocked footer during reload reconciliation.
- Adds worker-side plan size/step validation in addition to sidebar validation.
- Contains DOM-scan/readiness exceptions so periodic recovery does not create unhandled promise failures.
- Immediately notifies an open sidebar when an orphaned plan is rebound to a reopened conversation.
- Validates non-completion `STATUS` / `NEXT_ACTION` combinations before retrying or holding.
- Forces fresh submitted-token evidence during `CONTENT_READY` recovery, closing a reload-specific duplicate-send race.
- Quarantines malformed persisted current-schema plans (`corrupt-plan-state`) instead of retrying them forever.
- Static security/wiring pass confirms no dynamic-code execution, HTML injection sinks, remote code/network fetches, missing manifest references, or unused Chrome permissions in runtime source.
- Final regression gate: 70 test files.


## v2.0.11 Three-Clean-Pass Hardening

- Treats missing runtime responses as unacknowledged/retryable instead of falsely marking artifacts delivered.
- Future-schema plan states are read-only to older Codee builds, including start/retry, orphan rebinding, and save-conflict paths.
- Explicit protocol-requested retries now retire the old `STEP_TOKEN` and issue a fresh token for the new execution attempt; transient delivery retries still preserve their token for exactly-once recovery.
- Added regression coverage for future-state mutation isolation, missing worker acknowledgements, and explicit retry-token rotation.
- Completed three consecutive clean audit passes: state/signature fuzz + storage concurrency, provider/parser/message stress, and fresh-worker/package/restart verification.


## v2.0.15 Navigation Shell + Page Scaffolds

- Adds an accessible hamburger navigation drawer to the Codee sidebar.
- Adds internal pages for Runner, Active Plans, Prompts, Skills, Settings, Diagnostics, and About.
- Keeps Runner as the default page and moves the existing active-plan/progress UI into the Active Plans page without changing orchestration behavior.
- Opening a plan automatically switches to Active Plans.
- Adds Escape/backdrop/close-button drawer dismissal and active-page navigation state.
- Preserves the existing dark theme with shared navigation/page styles.
- Prompts, Skills, Settings, Diagnostics, and About are intentionally scaffold-only in this pass; their functional content is reserved for the next pass.
- Adds regression coverage for navigation shell wiring and page availability.


## Diagnostics & Recovery (v2.0.15)
The Diagnostics page reports active plan state, worker/content-script/composer health, one-minute recovery alarm status, current CODEE artifact validation, and a persistent recovery event log. Safe actions include Auto Repair & Resume, Re-scan Conversation, Retry Current Step, and Repair 1-Minute Timer. Signature-v2 plans ignore legacy ZIP events without mutating state, preventing ZIP/artifact concurrency from racing the canonical progression path.


## Copy All Diagnostics

The Diagnostics & Recovery page includes **Copy All Diagnostics**, which runs a fresh snapshot and copies plan state, connection health, artifact handshake details, checks, recovery log, and the raw diagnostic snapshot to the clipboard for troubleshooting.




## v2.1.3 Deep Cross-Pack Hardening

- Deep post-integration audit across Titan Zero + Repository/Coding intelligence, plan progression, privileged host governance, sanitizers, analyzers, registry wiring and MV3 runtime loading.
- Bounded previously unbounded PHP architecture imports/dependencies/container bindings, repository dependency token extraction, route-consumer evidence, model/schema drift, config environment keys, schema graph definitions, legacy SQL analysis and theme maps.
- Replaced route-consumer every-route × every-file scanning with a bounded one-pass literal/reference intersection and prototype-safe route maps.
- Hardened schema/table/theme/prefix maps against prototype-like source names such as `__proto__` and `toString`.
- Redacts and bounds host backup/mutation/verification/audit receipts before returning or auditing them; arbitrary metadata/evidence sanitizer maps now use null prototypes.
- Titan safe reports now expose structural remapped project graphs instead of raw route labels/URIs/arbitrary graph metadata.
- Repository diff and error-classifier evidence now pass through the central secret redactor.
- Repository source redaction now covers hard-coded browser cookies and sensitive local/session storage values.
- Change-set IDs/plan IDs/step IDs/receipt IDs/timestamps are bounded and redacted.
- Repository status payload is isolated to Repository-pack prompts/skills/profiles/capabilities instead of counting Titan/foreign registry rows.
- Titan command catalogue now distinguishes safe-channel commands from external/manual recommendations; config/route/view cache-clear commands are correctly backup-gated.
- Repository test selection emits concrete safe `php -l` commands for changed PHP files instead of a shell-redirection placeholder.
- Removed the duplicate legacy Titan CorePack from the production worker import path; wired the Titan error classifier and command catalogue into live analysis/registration metadata.
- Added permanent regressions for prototype pollution, secret-bearing evidence, analyzer/output ceilings, route/schema pathological inputs and command-policy/catalog drift.
- Completed three clean verification lenses after the final fix: complete regression/static pass, hostile-input/concurrency stress, and fresh extracted-ZIP verification.


## v2.1.2 Repository & Coding Intelligence Integration

- Integrates Codee Repository & Coding Intelligence Mega Pack v1.0.0 into the existing Runner/Plans/Prompts/Skills/Settings/Diagnostics architecture.
- Registers 28 repository/MCP capabilities, 24 prompts, 28 skills and 10 specialist profiles without creating a second runner, plan state machine, settings store, diagnostics application or MCP transport.
- Rebases the first Titan Zero mega pack so `app/Extensions/**` and extension-owned routes/schema/migrations are first-class intelligence sources.
- Adds deterministic repository inventory/search/symbol/dependency/Laravel/migration/diff/impact/change-set/rollback/test/verification/Git/log/error capabilities.
- Consumes the separately owned Codee MCP runtime through an adapter; MCP transport/auth/lifecycle remain outside this pack.
- Adds host-owned repository write/delete/command routes. Every mutating operation requires verified backup coverage before execution, then post-write verification, audit evidence and rollback metadata; Codee plan advancement remains core-owned.
- Hardens repository path traversal, generated/secret paths, quoted secret redaction, MCP evidence redaction, bounded snapshots/analysis, analyzer scale, regex stability and concurrent analysis caching.
- Narrows command classification so generic package scripts and Git branch mutations require backup/approval rather than being treated as reads.

## v2.1.1 Deep Integration Hardening

- Fixed rendered ChatGPT CODEE footer discovery when `textContent` flattens Markdown line breaks but `innerText` preserves them.
- Filters Codee's own user-side completion-contract template so it cannot be mistaken for a produced artifact.
- Hardened Titan Zero path scope against traversal, overlong paths, extension leakage through changed-path metadata, and unbounded snapshot/navigation inputs.
- Wired Titan Zero `autoDetect` so generic Laravel projects do not receive Titan context unless explicitly requested.
- Serialized per-tab Titan analysis cache writes and bounded retained tab analyses.
- Made repeated identical Titan context attachment idempotent.
- Fixed navigation aliases, cycles, duplicate IDs/routes, and corresponding risk/runtime diagnostics.
- Removed source-derived route literals from persisted/returned selected-context evidence.
- Fixed optional tab-ID null-to-zero coercion.
- Settings now report runtime synchronization failures instead of claiming full success.
- Titan setting changes invalidate stale cached/attached Titan context before later plan dispatches.
- Disabled analyzers now report as skipped rather than producing false model/schema/frontend failures.
- Added strict metadata/task/change-path bounds and strips URL query/fragment values from navigation metadata.
- Repository/filesystem access remains intentionally deferred to a future canonical Codee bridge; no Titan-specific competing bridge was added.

---

## v2.1.0 Titan Zero Developer Intelligence Integration

- Integrates the Titan Zero Developer Intelligence Mega Pack into Codee's existing Runner/Plans/Prompts/Skills/Settings/Diagnostics architecture.
- Registers 35 prompts, 38 skills, and 14 specialist profiles through one canonical Codee capability registry.
- Loads the donor's 35 plain-JavaScript analysis/runtime modules locally in the MV3 service worker; no remote runtime dependency is added.
- Adds read-only host-project analysis for DDL/schema, migrations, tenancy boundaries, Laravel/PHP architecture, routes and route consumers, Blade/Livewire/React/Alpine/Vite/Tailwind surfaces, navigation metadata, model/schema drift, versions, config variable names, project graph, risks, change impact, bounded context selection, and recommended test matrices.
- Enforces `integration-sources/*`, `donor-extracted/*`, `.env*`, logs, `.git`, `vendor`, and `node_modules` exclusions before Titan analysis; `app/Extensions/**` is intentionally included as first-class repository code.
- SQL input is reduced to DDL-only statements before analysis; arbitrary INSERT row values are neither exported nor persisted.
- `app/Extensions/**` is now first-class repository/Titan intelligence. `parseSqlRows=false` remains locked; secret/path redaction still applies.
- Titan Zero command definitions remain recommendation descriptors only; the pack receives no command-execution, repository-mutation, plan-advance, or extension-inspection authority.
- Derived Titan context is attached separately from approved plan text and appears before the final CODEE completion contract.
- No Titan Zero top-level page, second runner, second settings store, second diagnostics application, or second repository bridge is created.
- Codee v2.1.1 does not yet provide a repository/filesystem bridge. A canonical `ANALYZE_TITAN_ZERO_SNAPSHOT` receiver API is ready for a future base-level bridge. Raw repository snapshots are not persisted.


## v2.11.1 — Standalone Next Runner
- Runner page control sends literal `next` immediately on Start, then repeats at an adjustable 1–1440 minute interval.
- Timer state persists per conversation tab and alarms are restored on extension startup when the target tab still exists.
- Existing composer text is preserved; automatic `next` is skipped rather than overwriting a draft.
- Apply Timer changes cadence without forcing an immediate send; Stop cancels the repeating alarm.

### Timed Next plans in Active Plans

Standalone adjustable Next Runner sessions are now first-class entries in the Active Plans workspace. They remain isolated from the artifact/ZIP plan state machine, but expose their bound conversation, interval, next due time and live running state. Starting, changing or stopping the timed runner updates Active Plans immediately, and saved active timers are restored into the list when the sidebar reopens.

## Timed Next verified progression

Timed Next sessions now track persistent progression like Plan Runner passes. The counter advances only after the provider renders a new user message whose text is exactly `next`; composer clearing alone is not accepted as proof. Active Plans shows the verified Next count alongside cadence, while failed/skipped attempts are tracked separately. A new timed session resets its progression counters, and a failed initial send does not enter Running state.

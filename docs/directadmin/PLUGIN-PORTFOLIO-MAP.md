# Titan DirectAdmin Plugin Portfolio & Current-Code Assignment Map

Status: repo scan 2026-09-28  
Control-plane owner: #812  
Shared plugin SDK: #1049  
Business Engine: #1051

## 1. Purpose

This document assigns current Titan source families and active roadmap missions to the DirectAdmin Business Node plugin portfolio.

The goal is **maximum reuse without duplication**.

"Assigned to a plugin" means the plugin is the DirectAdmin control/management surface for that capability. It does **not** automatically mean moving canonical implementation source into `apps/directadmin`.

## 2. Portfolio

### Existing / already-missioned

| Plugin | Mission | Responsibility |
|---|---:|---|
| Titan Business Node Core | #812 | Server Node/meta-orchestration, system estate, master health/dependency graph |
| Cockpit SDK | #1049 | Shared plugin packaging, identity/company bridge, theme, nav, security, widgets, diagnostics |
| Titan Business Engine | #1051 | Optional Frappe/ERPNext extension provider, provisioning, mappings and tenancy |
| Titan Zero | #1046 | Zero, attention, approvals, daily brief, whole-business intelligence/control |
| Titan Workforce | #1050 | Agents/humans, hierarchy, work, Missions, conversations, autonomy, evidence |
| Titan Operations | #1045 | Server/apps/services/devices/nodes/sync/security/backups/domains/TLS/assurance |
| Titan Foundry | #1047 | Software/package discovery, build, preview, deploy, update, rollback, temporary apps |
| Titan Web | #1044 | Microweber/websites/WordPress/portals/publishing |
| Titan Dev | #1048 | Terminal, SSH keys, Codex, Git, diagnostics, MCP/capability debugging |
| Titan Experience | #1052 | Evolution skin/theme/navigation/personalisation/responsive cockpit UX |
| Titan Surfaces | #1059 | Interface estate, PWA/mobile/base-web/portal/generated-surface lifecycle, topology and health |
| Titan Channels | #1060 | External transport/provider endpoint connectivity, health, credentials and channel topology |
| Titan Interaction | #1061 | Expert Interaction Engine cockpit: intent, context, journeys, wizards, diagnostics |
| Titan Decision | #1062 | Expert Decision Engine cockpit: evidence, alternatives, scenarios, confidence, outcomes |

### Proposed new cockpit plugins

| Plugin | Primary current owners to consume | Why separate |
|---|---|---|
| Titan Communications | #1053 consuming #333, #363, Communications/Interaction, email templates | Business email/SMS/voice/inbox/reception/customer-care operations deserve one operational cockpit; server mail health remains Operations |
| Titan Finance & Commerce | #1054 consuming #343, #263, #273, #383, #638 | Quotes/invoices/payments/reconciliation/inventory/commerce/value are cohesive operator workflows; Frappe is an optional extension provider, not the default finance/FSM owner |
| Titan Intelligence | #1055 consuming #647, #59, #393, #153, #768 | Models/providers/local AI, Decision Intelligence, Memory/Knowledge, Personal Zero and intelligence health/configuration |
| Titan Governance & Assurance | #1056 consuming #914, #640, #423, #913, #14, #293, #916, #915, #917 | Constitution, Trust/Authority, evidence, compliance, Rewind, counterfactuals, sovereignty/capsule/federation |
| Titan Sprout | #1057 consuming #719, #769 and vertical packs | Install/configure/version vertical overlays and specialist packs without changing core |
| Titan Analytics | #393, #638, observability/value evidence | Optional if Analytics grows beyond Zero/Finance; initially can remain a Zero/Finance tab |

## 3. Current repo top-level assignment

### apps/

| Current source | DirectAdmin assignment | Action |
|---|---|---|
| `apps/directadmin/dev-access` | Titan Dev #1048 + SDK #1049 | Preserve server-validated packaging/diagnostic lessons; refactor shared pieces into SDK |
| `apps/web` | Full base web application; capabilities projected into Zero / Business Engine / Finance / Communications / other cockpits as relevant | Keep as the distinct full Titan base web application. It is **not** the PWA. Reuse canonical APIs/components; preserve mature native FSM persistence; converge duplicated runtime/contract seams and use #1051 only for deliberately delegated extensions rather than copying it into plugins. |
| `apps/mobile` | Titan Operations (device/node visibility) + Workforce | Do not port Flutter; expose Edge/device health/capability/configuration |
| `apps/browser` | Titan Operations + Dev + capability graph | Browser Node remains separate execution node; DA manages/observes it |
| `apps/desktop` | Titan Operations / Intelligence | Manage desktop/edge node status; do not transplant desktop shell |
| `apps/llm-plugin` | Titan Intelligence / capability diagnostics | Keep external-host adapter; DA manages availability/health/configuration |
| `apps/marketing` | Titan Web / Foundry | Public marketing deployment can be managed, source remains dedicated web app |

### packages/

| Current package | Plugin assignment |
|---|---|
| `business-services` | Business Engine + Zero + Workforce |
| `domain` | Business Engine; domain views surfaced in Zero/Finance/Operations |
| `email-templates` | Communications |
| `inventory` | Finance & Commerce + Business Engine |
| `log` | Operations + Dev |
| `modules` | Foundry + Sprout |
| `money` | Finance & Commerce + Business Engine |
| `observability` | Operations + Governance & Assurance |
| `offline` | Operations + Workforce |
| `onboarding` | Zero + Business Engine + Foundry commissioning |
| `provenance` | Governance & Assurance + every cockpit evidence drawer |
| `revenue-journey` | Finance & Commerce + Zero |
| `runtime/agent-runtime` | Workforce |
| `runtime/authority` | Governance & Assurance |
| `runtime/interaction-engine` | Interaction #1061; consumed by Zero + Communications + Workforce |
| `runtime/feed` | Zero / Operations attention feeds |
| `settings` | Business Node Core + Experience |
| `storage` | Operations + Governance & Assurance |
| `tools` | Foundry + Dev + Business Node Core capability graph |
| `workforce` | Workforce |
| `titan-platform/distributed` | Operations |
| `titan-platform/intelligence-runtime` | Intelligence |
| `titan-platform/offline` | Operations + Workforce |
| `titan-platform/personal-zero` | Intelligence + Zero |
| `titan-platform/retriever` | Intelligence |
| `titan-platform/storage` | Operations + Governance & Assurance |
| `titan-platform/surface` | Surfaces #1059 + SDK + Experience |
| `titan-platform/titan-builder` | Foundry + Web |
| `titan-platform/verticals` | Sprout |
| `titan-platform/workforce-*` | Workforce; trust aspects also Governance & Assurance |

### services/

| Service | Plugin assignment |
|---|---|
| `services/workforce` | Workforce; lifecycle controlled by Business Node Core |
| `services/worker` | Workforce / Operations depending worker type |

### infra/ + scripts/

| Current source | Plugin assignment |
|---|---|
| VPS compose/install/release | Business Node Core + Operations; generic implementation remains #322/#811 |
| backup/restore scripts | Operations + Governance & Assurance |
| health/SLO scripts | Operations |
| DB provision/migrate/seed | Business Engine + Operations |
| developer stack/scripts | Dev |
| portability reports | Governance & Assurance / Capsule |
| Windows runtime prep | Operations (node management), not DirectAdmin source |

## 4. Active mission assignment

| Issue | Plugin |
|---:|---|
| #812 | Business Node Core |
| #1049 | Cockpit SDK |
| #1051 | Business Engine |
| #1046 | Zero |
| #1050 | Workforce |
| #1045 | Operations |
| #1047 | Foundry |
| #1044 | Web |
| #1048 | Dev |
| #1052 | Experience |
| #913 | Governance & Assurance; evidence services consumed by all |
| #14 | Governance & Assurance; execution services consumed by all mutating plugins |
| #640 | Governance & Assurance |
| #914 | Governance & Assurance |
| #423 | Governance & Assurance |
| #293 | Operations + Governance & Assurance |
| #915 | Governance & Assurance / Sovereignty |
| #916 | Governance & Assurance + Intelligence |
| #917 | Governance & Assurance |
| #647 | Intelligence |
| #59 | Intelligence |
| #393 | Intelligence + Zero; analytics views may later split |
| #153 | Intelligence |
| #768 | Intelligence + Zero |
| #767 | Zero + Business Engine + Foundry commissioning |
| #639 | Workforce |
| #21 | Workforce + Zero |
| #353 | Workforce + Business Engine + Zero |
| #333 | Communications + Business Engine |
| #363 | Communications + Zero |
| #343 | Finance & Commerce + Zero |
| #263 | Finance & Commerce + Business Engine |
| #383 | Finance & Commerce + Business Engine |
| #273 | Finance & Commerce |
| #638 | Finance & Commerce + Zero |
| #373 | Zero + Communications + Web |
| #719 | Sprout |
| #769 | Sprout (Environmental pack) + Governance where compliance applies |
| #403 | Business Node Core + all provider-consuming plugins |
| #432 | Dev + Intelligence + Business Node Core |
| #7 | Business Node Core + Foundry + every capability-consuming plugin |
| #322 | Business Node Core + Operations + Foundry |
| #811 | Business Node Core + Workforce |
| #646 | Operations + Governance & Assurance |
| #645 | Operations |
| #572 | Operations + Governance & Assurance |
| #718 | Business Node Core + SDK + Foundry |
| #302 | SDK + Dev + Governance & Assurance |
| #542 | No DA replacement: one PWA + one native mobile app each expose Zero/Go/Hub modes; DA Surfaces/Zero/Workforce consume the same contracts |
| #809 | No direct port: `apps/web` remains the separate full base web application; DA cockpits reuse canonical APIs/domain contracts after duplicate persistence convergence |
| #643 | Operations/Dev management of Browser Node, not source move |
| #644 | Intelligence/Dev visibility of AI-host integration, not source move |
| #648 | Repo convergence; informs all plugin boundaries |

## 5. Proposed plugin boundaries in detail

### Titan Communications

Owns cockpit UX for:
- unified inbox;
- transactional/business email;
- SMS;
- voice;
- reception;
- customer care;
- templates;
- delivery/failure/retry;
- consent/quiet-hours;
- communications evidence.

Does not own:
- Postfix/Dovecot/Rspamd server lifecycle (Operations);
- Interaction Engine (canonical runtime);
- customer truth (Business Engine).

### Titan Finance & Commerce

Owns cockpit UX for:
- sales pipeline/quotes;
- invoices;
- payment state;
- reconciliation;
- refunds;
- expenses;
- inventory/procurement;
- commerce/orders/returns;
- cashflow/value/ROI views.

Native Titan FSM remains the default operational substrate. Selected extension capabilities may use Frappe/ERPNext through canonical Titan contracts; Evidence remains authoritative.

### Titan Intelligence

Owns cockpit UX/control for:
- models/providers;
- local AI runtimes;
- Cost Sovereignty;
- capability/model health;
- Memory/Knowledge diagnostics;
- Decision Intelligence;
- Personal Zero understanding configuration;
- embeddings/RAG/retrieval status;
- intelligence routing/fallback.

Does not grant business authority.

### Titan Governance & Assurance

Owns cockpit UX/control for:
- Constitution;
- Trust/Autonomy/effective authority;
- approvals/policies/limits;
- Evidence Ledger inspection;
- execution/verification history;
- compliance;
- audit packs;
- Rewind/recovery approvals;
- counterfactual branch governance;
- Capsule/Zero Recovery;
- sovereignty/federation;
- security/assurance findings.

### Titan Sprout

Owns:
- vertical packs;
- terminology;
- schemas/overlays;
- SOP/knowledge packs;
- vertical capability bundles;
- migration/version compatibility;
- install/enable/disable/upgrade;
- Environmental Intelligence and future industry packs.

It does not fork Titan core.

## 6. Porting policy

### PORT
Move/directly reuse code only when it is inherently DirectAdmin-specific:
- plugin route/skin integration;
- DirectAdmin API wrapper;
- DirectAdmin lifecycle hook;
- DirectAdmin packaging;
- panel-specific UI;
- host-specific privileged helper.

### EXPOSE
Canonical shared code remains in packages/services and is exposed to plugins:
- Workforce;
- business services;
- authority;
- evidence;
- Decision/Intelligence;
- domain;
- finance;
- storage;
- Edge;
- Foundry.

### ADAPT
Donor code can be adapted into its canonical owner first, then consumed by DirectAdmin.

### DO NOT COPY
Never create a plugin-local duplicate of:
- Business Evidence Ledger;
- Workforce runtime;
- authority engine;
- capability registry;
- CRM/customer/job truth;
- finance truth;
- memory/knowledge runtime.

## 7. Assignment decision rule for every existing file/module

For each source unit:

1. Is it DirectAdmin-specific?
   - Yes → move/reuse under appropriate `apps/directadmin/<plugin>`.
2. Is it canonical reusable business/runtime logic?
   - Yes → keep in packages/services, expose through plugin.
3. Is it provider-specific (Frappe, WordPress, Rspamd, Redis, MCP)?
   - Keep adapter/provider owner; expose lifecycle/control in assigned cockpit.
4. Is it a donor/legacy implementation?
   - compare against canonical owner, ADAPT missing behavior, then retire donor.
5. Is it temporary Mission/vertical code?
   - Foundry/Sprout lifecycle, never a permanent duplicate core.
6. Does it belong to Zero/Go/Hub user interaction?
   - keep canonical surface implementation; DA may offer expert/operator projection/deep link.

## 8. Next scan passes

The current top-level scan is complete. Implementation agents should now perform plugin-by-plugin deep scans in this order:

1. #1049 Cockpit SDK — extract shared DirectAdmin mechanics from `dev-access` and donors.
2. #812 Business Node Core — server/runtime/system-estate orchestration.
3. #1051 Business Engine — implement optional Frappe extension-provider contracts/mappings without replacing mature native Titan FSM domains by default.
4. #1048 Dev — converge diagnostics/Codex/terminal.
5. #1050 Workforce — deep-map `packages/workforce`, `services/workforce`, workforce sections of titan-platform.
6. #1046 Zero — deep-map Interaction/feeds/Business Reality/briefing.
7. #1045 Operations — deep-map observability/offline/distributed/storage/infra/scripts.
8. Communications — deep-map email templates/Interaction/Reception/Customer Care/Omni.
9. Finance & Commerce — deep-map money/inventory/revenue/commerce/sales.
10. Intelligence — deep-map intelligence-runtime/Decision/Memory/Personal Zero.
11. Governance & Assurance — deep-map authority/provenance/evidence/security/recovery.
12. #1047 Foundry — deep-map tools/modules/builder/deployment.
13. #1044 Web — deep-map web/marketing/Builder/Microweber donors.
14. Sprout #1057 — deep-map verticals/environmental packs.
15. #1059 Surfaces — interface estate/lifecycle over existing Interface Runtime/Builder/deployment contracts.
16. #1060 Channels — endpoint/provider transport estate; keep Communications semantics separate.
17. #1061 Interaction — expert cockpit over canonical Interaction Engine.
18. #1062 Decision — expert cockpit over canonical Decision Engine.
19. Experience — converge Evolution-native design system after cockpit needs are known.


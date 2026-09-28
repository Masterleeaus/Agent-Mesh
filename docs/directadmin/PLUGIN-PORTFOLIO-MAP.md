# Titan DirectAdmin Plugin Portfolio & Current-Code Assignment Map

Status: repo scan 2026-09-28  
Control-plane owner: #812  
Shared plugin SDK: #1049  
Business Engine: #1051

Portfolio status: the entries below map current missions to operator plugins; they do not assert implementation or installation. Former standalone Interaction #1061 and Decision #1062 plugins are closed as superseded. Their engines remain canonical services; #1063 owns their system configuration. This map assigns management surfaces, not proof that the plugins are implemented.

## 1. Purpose

This document assigns current Titan source families and active roadmap missions to the DirectAdmin Business Node plugin portfolio.

The goal is **maximum reuse without duplication**.

"Assigned to a plugin" means the plugin is the DirectAdmin control/management surface for that capability. It does **not** automatically mean moving canonical implementation source into `apps/directadmin`.

## 2. Missioned operator plugins

Display names below are the current Business Node navigation names. Canonical engines and source packages keep their technical identities; an operator plugin configures or observes them through contracts.

| Group | Plugin | Mission | Responsibility |
|---|---|---:|---|
| Business | Zero Core | #1046 | Attention, approvals, brief and whole-business intelligence/control |
| Business | Business Engine | #1051 | Frappe/ERPNext operational business substrate and tenancy |
| Business | Workforce Manager | #1050 | Agents/humans, hierarchy, work, Missions, conversations and evidence cockpit |
| Business | Communications Manager | #1053 | Inbox, messaging, reception and customer-care operations |
| Business | Finance & Commerce | #1054 | Quotes, invoices, payments, inventory and commerce workflows |
| Business | Business Standards | #1065 | Standards, SOP, quality, training and compliance lifecycle |
| Create | Brand Studio | #1044 | Websites, WordPress, Microweber, portals and publishing |
| Create | Surface Manager | #1059 | PWA/mobile/base-web/portal/generated-surface estate and health |
| Create | Application Generator | #1047 | Discovery, build, preview, deployment, update and rollback |
| Create | Industry Builder | #1057 | Vertical overlays and specialist packs |
| Intelligence & Control | Intelligence Core | #1055 | Models, Decision intelligence, memory and intelligence health |
| Intelligence & Control | Governance & Assurance | #1056 | Constitution, trust, authority, evidence and recovery |
| System | Operations Hub | #1045 | Server, apps, services, nodes, sync, security and backups |
| System | Channels & Integrations | #1060 | External transport/provider endpoint topology and credentials |
| System | System Configuration | #1063 | Configuration, topology and diagnostics of canonical internal engines, including Interaction and Decision |
| Platform | User Experience | #1052 | Evolution theme, navigation and responsive cockpit UX |
| Platform | Developer Portal | #1048 | Terminal, SSH keys, Codex, Git and diagnostics |

Business Node Core #812 coordinates the control plane. Business Node SDK #1049 supplies shared plugin infrastructure and may be hidden from ordinary user navigation. Standalone Interaction #1061 and Decision #1062 plugin proposals are closed/superseded; the engines remain canonical services. Analytics remains within current Zero/Finance/Intelligence assignments unless separately missioned.

## 3. Current repo top-level assignment

### apps/

| Current source | DirectAdmin assignment | Action |
|---|---|---|
| `apps/directadmin/dev-access` | Developer Portal #1048 + Business Node Business Node SDK #1049 | Preserve server-validated packaging/diagnostic lessons; refactor shared pieces into Business Node SDK |
| `apps/web` | Full Titan base web application; #809 migration, with cockpit projections where appropriate | Keep separate from the one-app/three-mode PWA under #542. Preserve reachable web/BFF routes; extract domain contracts and migrate duplicate CRM/ERP persistence behind Titan Domain APIs/#1051 before retirement. |
| `apps/mobile` | Operations Hub (device/node visibility) + Workforce Manager | Do not port Flutter; expose Edge/device health/capability/configuration |
| `apps/browser` | Operations Hub + Developer Portal + capability graph | Browser Node remains separate execution node; DA manages/observes it |
| `apps/desktop` | Operations Hub / Intelligence Core | Manage desktop/edge node status; do not transplant desktop shell |
| `apps/llm-plugin` | Intelligence Core / capability diagnostics | Keep external-host adapter; DA manages availability/health/configuration |
| `apps/marketing` | Brand Studio / Application Generator | Public marketing deployment can be managed, source remains dedicated web app |

### packages/

| Current package | Plugin assignment |
|---|---|
| `business-services` | Business Engine + Zero Core + Workforce Manager |
| `domain` | Business Engine; domain views surfaced in Zero Core/Finance/Operations Hub |
| `email-templates` | Communications Manager |
| `inventory` | Finance & Commerce + Business Engine |
| `log` | Operations Hub + Developer Portal |
| `modules` | Application Generator + Industry Builder |
| `money` | Finance & Commerce + Business Engine |
| `observability` | Operations Hub + Governance & Assurance |
| `offline` | Operations Hub + Workforce Manager |
| `onboarding` | Zero Core + Business Engine + Application Generator commissioning |
| `provenance` | Governance & Assurance + every cockpit evidence drawer |
| `revenue-journey` | Finance & Commerce + Zero Core |
| `runtime/agent-runtime` | Workforce Manager |
| `runtime/authority` | Governance & Assurance |
| `runtime/interaction-engine` | Canonical Interaction runtime; configured through System Configuration #1063 and consumed by Zero Core + Communications Manager + Workforce Manager |
| `runtime/feed` | Zero Core / Operations Hub attention feeds |
| `settings` | Business Node Core + System Configuration + User User Experience |
| `storage` | Operations Hub + Governance & Assurance |
| `tools` | Application Generator + Developer Portal + Business Node Core capability graph |
| `workforce` | Workforce Manager |
| `titan-platform/distributed` | Operations Hub |
| `titan-platform/intelligence-runtime` | Intelligence Core |
| `titan-platform/offline` | Operations Hub + Workforce Manager |
| `titan-platform/personal-zero` | Intelligence Core + Zero Core |
| `titan-platform/retriever` | Intelligence Core |
| `titan-platform/storage` | Operations Hub + Governance & Assurance |
| `titan-platform/surface` | Surfaces #1059 + Business Node SDK + User Experience |
| `titan-platform/titan-builder` | Application Generator + Brand Studio |
| `titan-platform/verticals` | Industry Builder |
| `titan-platform/workforce-*` | Workforce Manager; trust aspects also Governance & Assurance |

### services/

| Service | Plugin assignment |
|---|---|
| `services/workforce` | Workforce Manager; lifecycle controlled by Business Node Core |
| `services/worker` | Workforce Manager / Operations Hub depending worker type |

### infra/ + scripts/

| Current source | Plugin assignment |
|---|---|
| VPS compose/install/release | Business Node Core + Operations Hub; generic implementation remains #322/#811 |
| backup/restore scripts | Operations Hub + Governance & Assurance |
| health/SLO scripts | Operations Hub |
| DB provision/migrate/seed | Business Engine + Operations Hub |
| developer stack/scripts | Developer Portal |
| portability reports | Governance & Assurance / Capsule |
| Windows runtime prep | Operations Hub (node management), not DirectAdmin source |

## 4. Active mission assignment

| Issue | Plugin |
|---:|---|
| #812 | Business Node Core |
| #1049 | Business Node Business Node SDK |
| #1051 | Business Engine |
| #1046 | Zero Core |
| #1050 | Workforce Manager |
| #1045 | Operations Hub |
| #1047 | Application Generator |
| #1044 | Brand Studio |
| #1048 | Developer Portal |
| #1052 | User User Experience |
| #913 | Governance & Assurance; evidence services consumed by all |
| #14 | Governance & Assurance; execution services consumed by all mutating plugins |
| #640 | Governance & Assurance |
| #914 | Governance & Assurance |
| #423 | Governance & Assurance |
| #293 | Operations Hub + Governance & Assurance |
| #915 | Governance & Assurance / Sovereignty |
| #916 | Governance & Assurance + Intelligence Core |
| #917 | Governance & Assurance |
| #647 | Intelligence Core |
| #59 | Intelligence Core |
| #393 | Intelligence Core + Zero Core; analytics views may later split |
| #153 | Intelligence Core |
| #768 | Intelligence Core + Zero Core |
| #767 | Zero Core + Business Engine + Application Generator commissioning |
| #639 | Workforce Manager |
| #21 | Workforce Manager + Zero Core |
| #353 | Workforce Manager + Business Engine + Zero Core |
| #333 | Communications Manager + Business Engine |
| #363 | Communications Manager + Zero Core |
| #343 | Finance & Commerce + Zero Core |
| #263 | Finance & Commerce + Business Engine |
| #383 | Finance & Commerce + Business Engine |
| #273 | Finance & Commerce |
| #638 | Finance & Commerce + Zero Core |
| #373 | Zero Core + Communications Manager + Brand Studio |
| #719 | Industry Builder |
| #769 | Industry Builder (Environmental pack) + Governance where compliance applies |
| #403 | Business Node Core + all provider-consuming plugins |
| #432 | Developer Portal + Intelligence Core + Business Node Core |
| #7 | Business Node Core + Application Generator + every capability-consuming plugin |
| #322 | Business Node Core + Operations Hub + Application Generator |
| #811 | Business Node Core + Workforce Manager |
| #646 | Operations Hub + Governance & Assurance |
| #645 | Operations Hub |
| #572 | Operations Hub + Governance & Assurance |
| #718 | Business Node Core + Business Node SDK + Application Generator |
| #302 | Business Node SDK + Developer Portal + Governance & Assurance |
| #542 | No DA replacement: one PWA + one native mobile app each expose Zero Core/Go/Hub modes; DA Surfaces/Zero Core/Workforce Manager consume the same contracts |
| #809 | No direct port: `apps/web` remains the separate full base web application; DA cockpits reuse canonical APIs/domain contracts after duplicate persistence convergence |
| #1059 | Surface Manager, consuming the separate PWA/mobile and base web deployment contracts |
| #1060 | Channels & Integrations, consuming external transport/provider contracts |
| #1063 | System Configuration, consuming canonical engine configuration schemas; #1061/#1062 superseded |
| #1065 | Business Standards, consuming Knowledge/Evidence/Industry/Workforce Manager contracts |
| #643 | Operations Hub/Developer Portal management of Browser Node, not source move |
| #644 | Intelligence Core/Developer Portal visibility of AI-host integration, not source move |
| #648 | Repo convergence; informs all plugin boundaries |

## 5. Operator plugin boundaries in detail

### Communications Manager

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

### Finance & Commerce

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

Operational transactional substrate may use Frappe/ERPNext, but canonical Titan contracts and Evidence remain authoritative.

### Intelligence Core

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

### Industry Builder

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
3. #1051 Business Engine — map current domain/business/finance code to Frappe provider.
4. #1048 Developer Portal — converge diagnostics/Codex/terminal.
5. #1050 Workforce Manager — deep-map `packages/workforce`, `services/workforce`, workforce sections of titan-platform.
6. #1046 Zero Core — deep-map Interaction/feeds/Business Reality/briefing.
7. #1045 Operations Hub — deep-map observability/offline/distributed/storage/infra/scripts.
8. Communications — deep-map email templates/Interaction/Reception/Customer Care/Omni.
9. Finance & Commerce — deep-map money/inventory/revenue/commerce/sales.
10. Intelligence — deep-map intelligence-runtime/Decision/Memory/Personal Zero.
11. Governance & Assurance — deep-map authority/provenance/evidence/security/recovery.
12. #1047 Application Generator — deep-map tools/modules/builder/deployment.
13. #1044 Brand Studio — deep-map web/marketing/Builder/Microweber donors.
14. Industry Builder #1057 — deep-map verticals/environmental packs.
15. #1059 Surface Manager — interface estate/lifecycle over existing Interface Runtime/Builder/deployment contracts.
16. #1060 Channels — endpoint/provider transport estate; keep Communications semantics separate.
17. #1063 System Configuration — engine controls for Interaction/Decision and other canonical runtimes, without standalone engine plugins.
18. #1065 Business Standards — operational SOP, compliance, quality and training projections over canonical owners.
19. User Experience — converge Evolution-native design system after cockpit needs are known.

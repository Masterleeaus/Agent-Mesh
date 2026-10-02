# Titan DirectAdmin Business Node Control Plane

DirectAdmin is Titan Zero's first server-resident **Business Node control plane / meta-orchestration environment**.

It manages the business's digital system estate while canonical Titan services remain responsible for factual history, authority, Workforce identity and reusable business/runtime logic.

The #1049 continuation adds a signed-session bridge over #302 and three shared
SDK consumers in `zero-core/`, `operations-hub/`, and `brand-studio/`.
These source modules have disposable integration coverage but are not installed
DirectAdmin packages. The issuer, launched gateway and live Evolution migration
remain uncommissioned. See the [bridge contract](../../docs/contracts/directadmin-authenticated-session-bridge.md)
for the exact security bindings, ownership seams and evidence.

## Canonical docs

- [Plugin Development Guide](../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md)
- [Plugin Portfolio & Source Assignment](../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md)
- [Blueprint v3](../../docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md)
- [Canonical Rules](../../docs/architecture/CANONICAL-RULES.md)

## Plugin portfolio inventory

Folder names below are source paths, not stable DirectAdmin machine IDs. Resolve machine IDs and display labels through the canonical registry owner; do not infer IDs from folder names.

| Plugin | Source path / inventory note | Mission | Current scope or state |
|---|---|---:|---|
| Titan Business Node Core | [`server-node/`](./server-node/) | #812 | Existing read-only implementation slice; portfolio and host certification remain open. Active relay work is in [PR #1211](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1211). |
| Cockpit SDK | [`cockpit-sdk/`](./cockpit-sdk/README.md) | #1049 | Inventory note at this path; shared SDK/session-bridge source is in [PR #1204](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1204), not a separately installed plugin. |
| Titan Business Engine | [`business-engine/`](./business-engine/README.md) | #1051 | Portfolio inventory note; Frappe/ERPNext remains an optional provider beneath canonical Titan services. |
| Titan Zero | [`zero/`](./zero/README.md) | #1046 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Workforce | [`workforce/`](./workforce/PORTFOLIO-SCAFFOLD.md) | #1050 | Owner plugin source and richer README are in open [PR #1143](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1143); not merged or live-certified. |
| Titan Operations | [`operations/`](./operations/README.md) | #1045 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Foundry | [`foundry/`](./foundry/README.md) | #1047 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Web | [`web/`](./web/README.md) | #1044 | Portfolio inventory note; `apps/web` remains the separate full base web application. |
| Developer Portal (historical Titan Dev donor) | [`dev-access/`](./dev-access/) | #1048 | Historical donor reference only; see the current candidate and installation scope below. |
| Titan Experience | [`experience/`](./experience/README.md) | #1052 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Communications | [`communications/`](./communications/README.md) | #1053 | Proposed cockpit inventory note; implementation remains with canonical service owners and its mission. |
| Titan Finance & Commerce | [`finance-commerce/`](./finance-commerce/README.md) | #1054 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Intelligence | [`intelligence/`](./intelligence/README.md) | #1055 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Governance & Assurance | [`governance-assurance/`](./governance-assurance/README.md) | #1056 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Sprout | [`sprout/`](./sprout/README.md) | #1057 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Surfaces | [`surfaces/`](./surfaces/README.md) | #1059 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Channels | [`channels/`](./channels/README.md) | #1060 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Interaction | [`interaction/`](./interaction/README.md) | #1061 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Decision | [`decision/`](./decision/README.md) | #1062 | Portfolio inventory note; see snapshot scope and the owning mission for implementation state. |
| Titan Analytics | [`analytics/`](./analytics/README.md) | — | Proposed optional cockpit; no mission has been assigned. |

## Snapshot scope and active owner work

This inventory is audited against `main` at commit [`14163faa316ac6236e88167b7c8d8a5e95007c7e`](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/commit/14163faa316ac6236e88167b7c8d8a5e95007c7e). In that exact snapshot, the DirectAdmin source tree contains `server-node/` and `dev-access/`; the 18 portfolio paths introduced by #1187 were absent. This PR adds inventory documentation at those paths. That statement is limited to the audited base snapshot and #1187's documentation changes: it does not assert that implementation is absent from active branches, canonical packages, or installed hosts.

Active owner work not represented by that base snapshot:

- [PR #1143](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1143) contains the Workforce plugin routes, package tooling and the owner-authored `workforce/README.md`. It remains open and unmerged; host/session commissioning is incomplete. The #1187 inventory note uses a different filename so the owner README can land without an add/add conflict.
- [PR #1204](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1204) contains the signed-session bridge and shared consumer source. These modules are not installed DirectAdmin packages; the issuer, gateway and live Evolution migration remain uncommissioned.
- [PR #1209](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1209) carries the current Developer Portal source candidate. Its package and transport checks are evidence for that candidate, not proof of a live install or supported-host lifecycle.
- [PR #1211](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1211) carries the Server Node RAW relay and browser helper work; live DirectAdmin commissioning remains open.

## Developer Portal donor history and current candidate

The prior `dev-access/` donor/server-verification label is historical evidence, not certification of the currently installed plugin or a new candidate. The previously inspected installed v1.1.3 form had a reported CSRF failure and is not a verified rollback. PR #1209 reports source candidate v1.3.3 (archive SHA-256 `6145b02a9fc0626f31bf7350f881419cf5cfe41036879b724e5abf4c38addbbc`); the latest exact-head PHP package/transport workflow passed on PHP 8.3.6 at head `97a44e14abc92b216d861a17a777eceda4b6ab5e` ([run 36989703571](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36989703571)). An independent probe of that candidate accepted synthetic standard URL-encoded and stdin public-key form submissions. That evidence is synthetic and does not certify the reported diagnostics-v2 host install, its version/archive hash, or a successful live form submission. Live install, update, removal and rollback remain unverified.

## Shared implementation boundary

- `server-node/` contains a bounded read-only health implementation and package. Its integration, lifecycle and live-host certification remain with #812 and the linked owner work.
- The new folders are inventory notes, not proof of plugin completeness. Their source paths are not stable plugin IDs.
- Keep business, Workforce identity/runtime, authority, evidence and reusable service logic in canonical `packages/` and `services/` owners. Plugins consume those through stable contracts.
- `apps/web` remains the separate full base web application. The PWA and native mobile app each remain one app with Zero/Go/Hub modes; DirectAdmin folders do not replace or split those surfaces.
- Titan Analytics is a proposed optional cockpit in the portfolio map; it has no mission assignment and is not part of the supported install set yet.
- Do not copy canonical business/runtime implementations into plugins merely to expose them in DirectAdmin.
- Follow the [Plugin Development Guide](../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md) and [Portfolio Map](../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md).

## Multi-language plugins

DirectAdmin plugin GUI entrypoints are executable scripts. They may use PHP, Python, Perl, shell, Node, Ruby, native binaries or another executable runtime available on the server. See the Plugin Development Guide for the language/porting policy.

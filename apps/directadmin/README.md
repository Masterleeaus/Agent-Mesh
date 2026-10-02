# DirectAdmin plugin portfolio

This tree tracks the DirectAdmin plugin workspaces in the canonical portfolio map. A folder is an inventory/scaffold marker; it does not mean the plugin is packaged, installable, or complete. DirectAdmin runtime entrypoints and `plugin.conf` must be added by each mission when its implementation is ready.

| Plugin | Folder | Mission | State |
|---|---|---:|---|
| Titan Business Node Core | [`server-node/`](./server-node/) | #812 | Existing implementation slice; portfolio and host certification pending |
| Cockpit SDK | [`cockpit-sdk/`](./cockpit-sdk/) | #1049 | Scaffold only; not installable |
| Titan Business Engine | [`business-engine/`](./business-engine/) | #1051 | Scaffold only; not installable |
| Titan Zero | [`zero/`](./zero/) | #1046 | Scaffold only; not installable |
| Titan Workforce | [`workforce/`](./workforce/) | #1050 | Scaffold only; not installable |
| Titan Operations | [`operations/`](./operations/) | #1045 | Scaffold only; not installable |
| Titan Foundry | [`foundry/`](./foundry/) | #1047 | Scaffold only; not installable |
| Titan Web | [`web/`](./web/) | #1044 | Scaffold only; not installable |
| Titan Dev | [`dev-access/`](./dev-access/) | #1048 + #1049 | Existing server-validated donor |
| Titan Experience | [`experience/`](./experience/) | #1052 | Scaffold only; not installable |
| Titan Surfaces | [`surfaces/`](./surfaces/) | #1059 | Scaffold only; not installable |
| Titan Channels | [`channels/`](./channels/) | #1060 | Scaffold only; not installable |
| Titan Interaction | [`interaction/`](./interaction/) | #1061 | Scaffold only; not installable |
| Titan Decision | [`decision/`](./decision/) | #1062 | Scaffold only; not installable |
| Titan Communications | [`communications/`](./communications/) | #1053 | Scaffold only; not installable |
| Titan Finance & Commerce | [`finance-commerce/`](./finance-commerce/) | #1054 | Scaffold only; not installable |
| Titan Intelligence | [`intelligence/`](./intelligence/) | #1055 | Scaffold only; not installable |
| Titan Governance & Assurance | [`governance-assurance/`](./governance-assurance/) | #1056 | Scaffold only; not installable |
| Titan Sprout | [`sprout/`](./sprout/) | #1057 | Scaffold only; not installable |
| Titan Analytics | [`analytics/`](./analytics/) | — | Proposed; no mission; not installable |


## Shared implementation boundary

- `server-node/` contains a bounded read-only health implementation and package; portfolio integration and live-host certification remain open. `dev-access/` is the existing server-validated Titan Dev donor. Both are preserved.
- The 17 mission-linked scaffolds and proposed Analytics folder are documentation only and none is installable: each has no `plugin.conf`, executable role routes, lifecycle scripts, or package artifact. Folder names are source paths, not assertions of stable DirectAdmin machine IDs.
- Keep business, Workforce identity/runtime, authority, evidence, and reusable service logic in their canonical `packages/` and `services/` owners. Plugins consume those through stable contracts.
- `apps/web` remains the separate full base web application. The PWA and native mobile app each remain one app with Zero/Go/Hub modes; these plugin folders do not replace or split those surfaces.
- Titan Analytics is a proposed optional cockpit in the portfolio map; it has no mission assignment and is not part of the supported install set yet.
- Follow the [Plugin Development Guide](../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md) and [Portfolio Map](../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md).

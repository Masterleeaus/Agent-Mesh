# DirectAdmin plugin portfolio

This tree tracks the DirectAdmin plugin workspaces in the canonical portfolio map. A folder is an inventory/scaffold marker; it does not mean the plugin is packaged, installable, or complete. DirectAdmin runtime entrypoints and `plugin.conf` must be added by each mission when its implementation is ready.

| Plugin | Folder | Mission | State |
|---|---|---:|---|
| Titan Business Node Core | [`server-node/`](./server-node/) | #812 | Existing scaffold |
| Cockpit SDK | [`cockpit-sdk/`](./cockpit-sdk/) | #1049 | Scaffold only |
| Titan Business Engine | [`business-engine/`](./business-engine/) | #1051 | Scaffold only |
| Titan Zero | [`zero/`](./zero/) | #1046 | Scaffold only |
| Titan Workforce | [`workforce/`](./workforce/) | #1050 | Scaffold only |
| Titan Operations | [`operations/`](./operations/) | #1045 | Scaffold only |
| Titan Foundry | [`foundry/`](./foundry/) | #1047 | Scaffold only |
| Titan Web | [`web/`](./web/) | #1044 | Scaffold only |
| Titan Dev | [`dev-access/`](./dev-access/) | #1048 + #1049 | Existing donor |
| Titan Experience | [`experience/`](./experience/) | #1052 | Scaffold only |
| Titan Surfaces | [`surfaces/`](./surfaces/) | #1059 | Scaffold only |
| Titan Channels | [`channels/`](./channels/) | #1060 | Scaffold only |
| Titan Interaction | [`interaction/`](./interaction/) | #1061 | Scaffold only |
| Titan Decision | [`decision/`](./decision/) | #1062 | Scaffold only |
| Titan Communications | [`communications/`](./communications/) | #1053 | Scaffold only |
| Titan Finance & Commerce | [`finance-commerce/`](./finance-commerce/) | #1054 | Scaffold only |
| Titan Intelligence | [`intelligence/`](./intelligence/) | #1055 | Scaffold only |
| Titan Governance & Assurance | [`governance-assurance/`](./governance-assurance/) | #1056 | Scaffold only |
| Titan Sprout | [`sprout/`](./sprout/) | #1057 | Scaffold only |
| Titan Analytics | [`analytics/`](./analytics/) | — | Proposed; no mission |


## Shared implementation boundary

- `server-node/` is the existing control-plane scaffold; `dev-access/` is the existing Titan Dev donor. Both are preserved.
- Each plugin folder links its portfolio mission and states its DirectAdmin responsibility. The scaffolds do not copy domain/runtime logic.
- Keep business, Workforce identity/runtime, authority, evidence, and reusable service logic in their canonical `packages/` and `services/` owners. Plugins consume those through stable contracts.
- Titan Analytics is a proposed optional cockpit in the portfolio map; it has no mission assignment and is not part of the supported install set yet.
- Follow the [Plugin Development Guide](../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md) and [Portfolio Map](../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md).

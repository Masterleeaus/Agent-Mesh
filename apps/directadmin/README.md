# Titan DirectAdmin Business Node Control Plane

DirectAdmin is Titan Zero's first server-resident **Business Node control plane / meta-orchestration environment**.

It manages the business's digital system estate while canonical Titan services remain responsible for factual history, authority, Workforce identity and reusable business/runtime logic.

## Canonical docs

- [Plugin Development Guide](../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md)
- [Plugin Portfolio & Source Assignment](../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md)
- [Blueprint v3](../../docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md)
- [Canonical Rules](../../docs/architecture/CANONICAL-RULES.md)

## Plugin portfolio

- Business Node Core — #812
- Cockpit SDK — #1049
- Business Engine / Frappe — #1051
- Zero — #1046
- Workforce — #1050
- Operations — #1045
- Foundry — #1047
- Web / Portal — #1044
- Dev — #1048
- Experience — #1052
- Communications — dedicated cockpit mission
- Finance & Commerce — dedicated cockpit mission
- Intelligence — dedicated cockpit mission
- Governance & Assurance — dedicated cockpit mission
- Sprout / Vertical Packs — dedicated cockpit mission

Current server-validated donor/reference:

- `dev-access/`

Do not copy canonical business/runtime implementations into plugins merely to expose them in DirectAdmin. Keep reusable implementations in `packages/` / `services/` and consume them through stable contracts.

## Multi-language plugins

DirectAdmin plugin GUI entrypoints are executable scripts. They may use PHP, Python, Perl, shell, Node, Ruby, native binaries or another executable runtime available on the server. See the Plugin Development Guide for the language/porting policy.

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
- Communications — #1053
- Finance & Commerce — #1054
- Intelligence — #1055
- Governance & Assurance — #1056
- Sprout / Vertical Packs — #1057
- Surface Manager — #1059
- Channels & Integrations — #1060
- System Configuration — #1063 (Interaction and Decision engines are configured here, not separate plugins)
- Business Standards — #1065

Current server-validated donor/reference:

- `dev-access/`

Do not copy canonical business/runtime implementations into plugins merely to expose them in DirectAdmin. Keep reusable implementations in `packages/` / `services/` and consume them through stable contracts.

## Multi-language plugins

DirectAdmin plugin GUI entrypoints are executable scripts. They may use PHP, Python, Perl, shell, Node, Ruby, native binaries or another executable runtime available on the server. See the Plugin Development Guide for the language/porting policy.

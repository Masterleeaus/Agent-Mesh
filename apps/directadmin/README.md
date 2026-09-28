# Titan DirectAdmin Business Node Control Plane

DirectAdmin is Titan Zero's first server-resident **Business Node control plane / meta-orchestration environment**.

It manages the business's digital system estate while canonical Titan services remain responsible for factual history, authority, Workforce identity and reusable business/runtime logic.

## Canonical docs

- [Plugin Development Guide](../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md)
- [Plugin Portfolio & Source Assignment](../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md)
- [Blueprint v3](../../docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md)
- [Canonical Rules](../../docs/architecture/CANONICAL-RULES.md)

## Plugin portfolio

DirectAdmin is the Business Node control plane (#812). The operator plugin display names and current mission owners are grouped for navigation below. These names do not rename internal runtime technologies.

| Navigation group | Plugin display name and mission |
|---|---|
| Business | Zero Core #1046 · Business Engine #1051 · Workforce Manager #1050 · Communications Manager #1053 · Finance & Commerce #1054 · Business Standards #1065 |
| Create | Brand Studio #1044 · Surface Manager #1059 · Application Generator #1047 · Industry Builder #1057 |
| Intelligence & Control | Intelligence Core #1055 · Governance & Assurance #1056 |
| System | Operations Hub #1045 · Channels & Integrations #1060 · System Configuration #1063 |
| Platform | User Experience #1052 · Developer Portal #1048 |

Business Node SDK #1049 is shared infrastructure, not necessarily a user navigation item. Interaction and Decision remain canonical engines configured through System Configuration; standalone plugin proposals #1061/#1062 are superseded. The checked-in plugin donor below is not proof that this portfolio is installed.

Current server-validated donor/reference:

- `dev-access/`

Do not copy canonical business/runtime implementations into plugins merely to expose them in DirectAdmin. Keep reusable implementations in `packages/` / `services/` and consume them through stable contracts.

## Multi-language plugins

DirectAdmin plugin GUI entrypoints are executable scripts. They may use PHP, Python, Perl, shell, Node, Ruby, native binaries or another executable runtime available on the server. See the Plugin Development Guide for the language/porting policy.

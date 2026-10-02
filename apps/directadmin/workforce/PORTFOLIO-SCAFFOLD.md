# Titan Workforce inventory note

- Portfolio mission: #1050
- Base snapshot: this proposed source path was absent at audited `main` commit `14163faa316ac6236e88167b7c8d8a5e95007c7e`.
- #1187 scope: this inventory note is separate from the owner implementation in open PR #1143.
- DirectAdmin scope: Company-scoped Workforce management cockpit projecting canonical agents, work, missions, conversations, autonomy, evidence and health.

Snapshot scope: at audited `main` commit `14163faa316ac6236e88167b7c8d8a5e95007c7e`, this proposed DirectAdmin source path was absent. This file is an inventory note added by #1187; it does not claim the owner implementation is absent from open [PR #1143](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/pull/1143), canonical packages, or installed hosts. The owner PR contains the richer `README.md` and plugin/package source; this note uses a separate filename so that README can land without an add/add conflict. See the [portfolio index snapshot scope](../README.md#snapshot-scope-and-active-owner-work).

Consume canonical Titan contracts and shared Cockpit SDK work; do not add a plugin-local copy of business/runtime, Workforce, authority, evidence or persistence logic. See the [Plugin Development Guide](../../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md) and [portfolio map](../../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md).

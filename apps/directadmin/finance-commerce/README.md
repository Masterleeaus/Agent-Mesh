# Titan Finance & Commerce

- Portfolio mission: #1054
- Base snapshot: this proposed source path was absent at audited `main` commit `14163faa316ac6236e88167b7c8d8a5e95007c7e`.
- #1187 scope: inventory documentation only at this path.
- DirectAdmin scope: Quotes, invoices, payments, reconciliation, inventory, commerce and value workflows.

Snapshot scope: at audited `main` commit `14163faa316ac6236e88167b7c8d8a5e95007c7e`, this proposed DirectAdmin source path was absent. This file is an inventory note added by #1187; it does not claim that owner implementation is absent from active branches, canonical packages, or installed hosts. See the [portfolio index snapshot scope](../README.md#snapshot-scope-and-active-owner-work) for linked owner PRs and current boundaries.

Consume canonical Titan contracts and shared Cockpit SDK work; do not add a plugin-local copy of business/runtime, Workforce, authority, evidence or persistence logic. See the [Plugin Development Guide](../../../docs/directadmin/PLUGIN-DEVELOPMENT-GUIDE.md) and [portfolio map](../../../docs/directadmin/PLUGIN-PORTFOLIO-MAP.md).

# Titan Zero Developer Intelligence — Codee Integration

Codee integrates `Titan-Zero-Developer-Intelligence-Mega-Pack-v1.0.0` as a read-only capability family.

## Authority

Codee remains authoritative for plan execution/advancement, provider dispatch, Chrome MV3 lifecycle, settings persistence, diagnostics rendering, repository/file access, approvals, command execution and artifact completion. Titan Zero intelligence cannot advance plans, mutate repositories, submit prompts directly or execute commands.

## Existing surfaces

- Runner: accepts bounded derived Titan context only after a canonical snapshot provider supplies a safe host snapshot.
- Active Plans: stores Titan context/preflight evidence separately from exact approved step text.
- Prompts: 35 donor prompts registered in the canonical Codee prompt library.
- Skills: 38 donor skills registered in the canonical Codee skill library.
- Profiles: 14 specialist records retained in the canonical capability data layer; no second profile runtime is created.
- Settings: Titan Zero preferences are nested under `codeePreferences.titanZero`.
- Diagnostics: pack registration and latest sanitized host-analysis summary appear inside existing Diagnostics.

## Hard boundaries

`app/Extensions/**` is included as first-class project code. `integration-sources/*`, `donor-extracted/*`, `.env*`, logs, `.git`, vendor and node_modules remain excluded. Full SQL dumps are processed locally into DDL-only text before analysis; INSERT row values are not retained, exported or attached to AI prompts. Extension inclusion is locked on and `parseSqlRows=false` is locked.

## Repository intelligence status

Codee v2.1.3 includes the canonical Repository & Coding Intelligence capability layer and can feed sanitized repository snapshots into both repository and Titan intelligence. A privileged filesystem/process bridge is still host-owned and is not fabricated inside the extension. When that host bridge is present, all mutating operations are backup-gated and independently verified/audited. Raw snapshots are not persisted; only bounded derived analysis is stored.

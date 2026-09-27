# Upgrade — Titan Interface Runtime v1.0

## v1.0.0 → v1.0.1

v1.0.1 is a packaging-only compatibility hotfix for Titan Extension Manager Installer 1.7.6/legacy Laravel file enumeration. It removes hidden `.gitkeep` placeholders that are extracted but excluded by `File::allFiles()` during integrity verification. There are no migrations and no authoritative business-data changes.


All implementation passes are cumulative under plan `d55dfe16-0a2b-4357-bd5c-6c71d3aae4b9`.

## v0.19.0 → v1.0.0

v1.0.0 is migration-free. Replace the prior cumulative package with the matching v1.0.0 installer build, then verify liveness/readiness, Interface Contribution discovery, menu projection and Command/Go/Hub/Onboarding policies. No business/domain schema migration is performed by Interface Runtime.

For the current Website1408 snapshot, use the separately labeled Website1408 Installer 1.7.8 transition ZIP. Once the host validator accepts the latest strict Step-10 root schema, use the canonical flat-root package instead.

Donor UI retirement must follow `docs/MIGRATION-GUIDE-v1.md`; do not remove Announcement or Onboarding-owned data merely because their presentation primitives have moved into Interface Runtime.

## Rollback

Reinstall the previously verified cumulative package and re-enable any donor presentation extension disabled during cutover. Interface Runtime does not migrate/delete authoritative domain or donor records, so rollback is package/configuration restoration rather than business-data reconstruction.

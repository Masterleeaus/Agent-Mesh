# GitHub portfolio and repository consolidation audit

**Review date:** 2026-10-02  
**Scope:** The 33 repositories returned by the connected GitHub account for `Masterleeaus`. This is a first-pass portfolio review based on repository metadata, root contents, README contents, and known product context. It is not a full source-code or runtime audit of every repository.

## Current product anchor

`Masterleeaus/Titan-Zero-Field-Service-Workforce` is the current, actively developed Titan Zero field-service workforce monorepo. Keep its distinct product surfaces and modules in this repository unless a deliberate extraction plan names an owner, contracts, release process, and migration path.

The similarly named older Titan repositories should be presented as archived prototypes, historical snapshots, or supporting components only after their contents and lineage are verified.

## Consolidation candidates

| Repository/group | Evidence | Recommendation |
|---|---|---|
| `clean`, `cleanly`, `modules`, `cleanhub`, `cleanhub2` | Cleaning-project naming overlaps. `modules` and `cleanly` had identical README blob SHA and content on the inspected default branches, while repo sizes differ. `cleanhub` is empty; `cleanhub2` contains only a 12-byte heading before this review. `clean` contains substantial code and a branch recovery implementation summary. | Treat as a lineage/consolidation group, not proven duplicates. Compare complete Git trees and histories before moving, archiving, or deleting anything. The `clean` repo has potentially useful recovery work and must not be labeled inferior based on README length. Consider removing the empty/near-empty placeholders only after checking branches, settings, and external references. |
| `Titan-Zero`, `Titan-Zero-Field-Service-Workforce`, `Titan-BOS`, `zero`, `Titanzero`, `Titancore` | Multiple repositories share the Titan Zero product name. `Titan-Zero` contains only a short integration-repository README; `zero` has a large Laravel codebase; `Titan-BOS`, `Titanzero`, and `Titancore` have separate codebases; the field-service workforce repo is the current TypeScript product anchor. | Retain the workforce repo as the current product. Classify the others as distinct legacy/source assets or prototypes only after code/history/licensing review; do not delete or merge based on name alone. |
| `TitanPro`, `Titan-BOS`, `cleanly`, `modules`, `Worksuite-Saas---Project-Management-System_Laravel` | Multiple large Laravel projects may share imported or adapted source. `cleanly` and `modules` share README blob SHA, but repository sizes and file inventories differ. | Compare Git tree hashes and package/module manifests; establish canonical source and provenance before consolidating. Retain only intentional standalone products or source archives. |
| `Documents` | Repository root includes a ZIP archive and a `workcore` directory; repository name and landing-page context are unclear. | Decide whether this is a private archive, a public documentation product, or obsolete material. If retained publicly, replace archive-only presentation with a curated documentation index and provenance. |

## Likely independent projects to retain

The following have distinct product identities in the inspected repository inventory: `ZeroPay`, `Interaction-engine`, `Titan-themes`, `workcore-extensions`, `Ai-extensions`, `Developer-Workforce-Extension-`, `AI-Coding-Studio`, `Titan-Builder`, `ForgeMesh`, `Climate-crew`, `Commerce-Crew`, `Tenant-Forge`, `Delivery-Management-Platform`, `predictive-analytics-module`, `Ai-Medical-Voice-Agent-Saas-App`, `Ai_agent_voice_assistance_using_vapi`, `callingagent-`, `gearbox`, `Uniquely`, and `Worksuite-Saas---Project-Management-System_Laravel`. This is a retain-for-review list, not a completeness or quality certification.

## Portfolio presentation gaps observed

- Several substantive repositories had no README at review start, including `zero`, `TitanPro`, `Titancore`, `Titanzero`, and `Documents`. README landing pages have now been added to the first four; `Documents` still needs provenance and an archive index.
- `Ai_agent_voice_assistance_using_vapi` README began with instructions to the repo owner and contained a nested copy of a README; this has been replaced with an evidence-based prototype guide.
- `Developer-Workforce-Extension-` has a short migration note without setup, status, verification, or banner.
- `Titan-Zero` README was a 339-byte integration note; it now identifies the repo as a staging/integration snapshot and links to the current product and supporting repositories.
- `clean` README was only 171 bytes; it now explains its branch-recovery and predecessor context. `cleanhub2` was 12 bytes and `cleanhub` was empty; both now identify their placeholder status.
- Several detailed READMEs lack a visual header/banner. Existing project-specific artwork should be used where already checked in; otherwise add a verified project asset with a working relative path and descriptive alt text.
- Imported/vendor-derived projects should clearly identify upstream source, modifications, current maintenance status, and license obligations.

## Required full-completion checks

Before a repository is called portfolio-ready, review:
1. Purpose, target users, status, ownership, and relationship to other repos.
2. Install/setup instructions that match the checked-in files.
3. Configuration and secrets handling; scan history and current tree for leaked credentials.
4. Build, test, lint, security, and deployment commands, with observed results.
5. CI workflows and branch/release policies.
6. License, attribution, third-party notices, and source provenance.
7. Screenshots or project-specific banner with working relative paths and accessibility text.
8. Remove accidental artifacts (for example OS metadata, caches, generated bundles, or nested source ZIPs) only after confirming they are not intentional deliverables.
9. Duplicate detection by Git tree/content hashes and history; record canonical destination before retiring anything.
10. Final status label: maintained, prototype, archived, source archive, or deletion candidate.

## Deletion handling

This file records candidates for review only. No repository was deleted, archived, renamed, made private/public, or had issues/settings changed as part of this audit.

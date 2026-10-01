# GitHub portfolio and repository consolidation audit

**Review date:** 2026-10-02  
**Scope:** The 33 repositories returned by the connected GitHub account for `Masterleeaus`. This is a staged portfolio review based on repository metadata, root contents, selected configuration/manifests, and known product context. It is not a full source-code or runtime audit of every repository.

## Current product anchor

`Masterleeaus/Titan-Zero-Field-Service-Workforce` is the current, actively developed Titan Zero field-service workforce monorepo. Keep its distinct product surfaces and modules in this repository unless a deliberate extraction plan names an owner, contracts, release process, and migration path.

Older Titan repositories should be presented as archived prototypes, historical snapshots, or supporting components only after their contents and lineage are verified.

## Changes made in this review

- Replaced the pasted-template README in `Ai_agent_voice_assistance_using_vapi` with an evidence-based prototype guide and called out its hard-coded data path, debug mode, customer-data logging, and absent dependency manifest.
- Rewrote `Titan-Zero` README as an integration snapshot and linked it to current and supporting projects.
- Added landing pages/status notes to `zero`, `TitanPro`, `Titanzero`, `Titancore`, `Documents`, `cleanhub`, and `cleanhub2`.
- Expanded `clean`'s README to describe branch-recovery work and predecessor status without classifying the substantial repo as inferior.
- Expanded `Developer-Workforce-Extension-` README with project identity, install guidance, workstream links, safety boundaries, and its relationship to the business application. Added package-level install/provenance notes in the actual extension directory.
- Improved the `Interaction-engine` README to distinguish historical standalone checks from host integration that remains unverified.
- Improved `Titan-themes` README with source structure, validation scope, relationship to the current app, and distribution limits.
- Added this audit file to the current workforce repo.

These are documentation changes. No runtime test or build is claimed from these edits.

## Security incidents requiring owner action

### TitanPro environment credentials

A tracked `TitanPro/.env.development` contained non-empty database, application-key, and Reverb credentials. The file has been removed from the current branch, `.env.development.template` was added with blank placeholders, and `.gitignore` now ignores local `.env.*` files while retaining `.env.example`. A non-secret incident record is in `TitanPro/SECURITY-INCIDENT-2026-10-02.md`.

The credentials remain in Git history. They need rotation/revocation, exposure review, and a decision about history rewrite. Remediation is not complete until rotation and historical containment are verified.

### TitanPro deployment details

`TitanPro/README.txt` exposed a host filesystem path, live-looking domain, and deployment commands. Those details have been removed from the current tree and replaced with generic deployment guidance. Review history, archives, bundles, and logs for copies; keep host details in private deployment records.

## Consolidation candidates

| Repository/group | Evidence | Recommendation |
|---|---|---|
| `clean`, `cleanly`, `modules`, `cleanhub`, `cleanhub2` | Cleaning-project naming overlaps. `modules` and `cleanly` had identical README blob SHA/content on inspected default branches, while repo sizes differ. `cleanhub` was empty and `cleanhub2` contained only a short placeholder README plus Git attributes/ignore files before this review. `clean` contains substantial code and a branch recovery implementation summary. | Treat as a lineage/consolidation group, not proven duplicates. Compare complete Git trees and histories before moving, archiving, or deleting anything. Preserve `clean` recovery work pending review. Consider removing placeholders only after checking branches, settings, and external references. |
| `Titan-Zero`, `Titan-Zero-Field-Service-Workforce`, `Titan-BOS`, `zero`, `Titanzero`, `Titancore` | Multiple repositories share the Titan Zero product name. `Titan-Zero` is an integration snapshot; `zero` is a large Laravel codebase; `Titan-BOS`, `Titanzero`, and `Titancore` have separate codebases; the workforce repo is the current TypeScript product anchor. | Retain the workforce repo as the current product. Classify others as distinct legacy/source assets or prototypes only after code/history/licensing review; do not delete or merge based on name alone. |
| `TitanPro`, `Titan-BOS`, `cleanly`, `modules`, `Worksuite-Saas---Project-Management-System_Laravel` | Multiple large Laravel projects may share imported or adapted source. `cleanly` and `modules` share README blob SHA, but repository sizes and file inventories differ. `TitanPro` includes dedicated Mobile/PWA/Web trees and migration records. | Compare Git tree hashes, manifests, and provenance; establish canonical source before consolidation. Keep separate only where there is a distinct product or source-retention purpose. |
| `Documents` | Root contains `TitanDocs 2.zip` and `workcore/`; the latter has a README and a full document corpus index. | Top-level README routes readers to the curated index and labels the ZIP as unaudited source material. Review ZIP contents/provenance before reuse. |

## Likely independent projects to retain

The inspected inventory contains distinct projects including `ZeroPay`, `Interaction-engine`, `Titan-themes`, `workcore-extensions`, `Ai-extensions`, `Developer-Workforce-Extension-`, `AI-Coding-Studio`, `Titan-Builder`, `ForgeMesh`, `Climate-crew`, `Commerce-Crew`, `Tenant-Forge`, `Delivery-Management-Platform`, `predictive-analytics-module`, `Ai-Medical-Voice-Agent-Saas-App`, `Ai_agent_voice_assistance_using_vapi`, `callingagent-`, `gearbox`, `Uniquely`, and `Worksuite-Saas---Project-Management-System_Laravel`. This is a retain-for-review list, not a quality or completeness certification.

## Remaining portfolio gaps

- `Developer-Workforce-Extension-` retains an opaque upstream ID/version directory containing the seed extension; it now has a package-level README. Normalize the path only through a provenance-preserving migration.
- `Documents` has a landing README; the ZIP archive still needs contents and provenance review.
- Many substantive READMEs lack project-specific wide banners. Use existing repo artwork where verified; do not substitute unrelated images or imply a banner exists when it does not.
- Several repositories still need stronger status, setup, CI/test, license/provenance, and screenshot coverage.
- Repository descriptions/topics, release tags, branch protection, and repo-level settings have not been normalized because no repository metadata update operation was exposed in this session.
- Some repositories contain imported ZIPs, generated artifacts, environment variants, or OS files. Review each item and its history before removing it.
- Full tree-level duplicate analysis has not been run across all 33 repositories.

## Full completion checks

Before a repository is called portfolio-ready, review:
1. Purpose, target users, status, ownership, and relationship to other repos.
2. Install/setup instructions that match checked-in files.
3. Current and historical credential exposure.
4. Build, test, lint, security, and deployment commands with observed results.
5. CI workflows and branch/release policies.
6. License, attribution, third-party notices, and source provenance.
7. Project-specific banners/screenshots with valid relative paths and accessible alt text.
8. Accidental artifacts, caches, OS metadata, generated bundles, and nested source ZIPs—remove only after confirming they are not intentional.
9. Duplicate detection by complete tree hashes/history, with a named canonical destination.
10. Final status label: maintained, prototype, archived, source archive, or deletion candidate.

## Deletion handling

This file records candidates only. No repository was deleted, archived, renamed, made private/public, or had repository settings changed in this review.

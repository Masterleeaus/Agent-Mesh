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
- Portfolio banner pass added checked-in, project-specific SVG headers to 29 additional substantive repositories; there are now 30 checked-in SVG banner assets; Climate Crew retains its existing wide PNG header, so 31 of 33 default-branch READMEs have a checked-in banner. The two near-empty deletion candidates remain intentionally unbranded. Verify image rendering in GitHub after any repository rename.
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


## Additional findings — 2026-10-02 pass

### Environment-file cleanup

- `modules/.env.development` and `Delivery-Management-Platform/.env.development` were tracked on the default branch. Both are removed from the current tree. Sanitized `.env.development.template` files were added and ignore rules now cover `.env.*` while allowing `.env.example` and `.env.*.template`.
- `modules/.env.development` contained a public project URL and populated app/realtime credentials. Treat those values as exposed and rotate the application signing key and realtime credentials. The Delivery Management file contained populated app/realtime credentials; rotate them as a precaution. Both remain in Git history; inspect history and decide on history containment after rotation.
- `Worksuite-Saas---Project-Management-System_Laravel/.env.dev` also contained populated application/JWT/payment values. It has been removed from the current branch; ignore rules now exclude local env variants while retaining the upstream `.env.example`.
- `cleanly/.env.dev` contained populated application/JWT/payment values. It has been removed from the current tree and local env ignore rules now cover variants.
- Removing these files from the current tree does not revoke credentials or erase Git history. Rotation/revocation and history review remain outstanding. Do not expose secrets when coordinating that work.

### README duplication and portfolio disposition

- `cleanly` and `modules` had identical README content/blob before this pass, but their complete recursive trees differ substantially (11,260 vs 6,305 entries at the reviewed commits). This is a **README duplication**, not a proven repository duplicate. `modules` is documented as the Titan BOS application source. `cleanly` is private and still needs an accurate description of its actual code before any visibility or disposition decision. Neither is a deletion candidate based solely on this comparison.
- `Worksuite-Saas---Project-Management-System_Laravel` is a public, large imported third-party codebase. Its README now records vendor provenance and marks it for archive/deletion review. This is a **deletion-review candidate**, not an instruction to delete it. Preserve its vendor attribution and license until the owner decides.
- `Delivery-Management-Platform` is a distinct, small Laravel application with upstream authorship evident in its README. Keep as a source/provenance archive or assess license and relevance before portfolio promotion. It is not a duplicate of the Titan BOS application.
- `cleanly` is currently private, so it is not visible in the public portfolio. Decide its intended audience only after its repository-specific README is written.

### Pass status

Current tree scans confirm the two cleaned Titan BOS source repositories retain an example env file and sanitized template; populated tracked local env files were removed in this pass. A full historical secret scan, credential rotation, complete test/build verification across all repositories, banner creation for every project, repository metadata normalization, and complete 33-repository tree/history comparison are still outstanding.


## Additional findings — portfolio visibility pass

### README and banner inventory

- Rechecked all 33 repositories: each default branch has a README, and no byte-for-byte duplicate README remains. This does not certify content accuracy or runtime completeness.
- Wide project-specific banners remain inconsistent. Several READMEs use text-only headers; the Worksuite import had a placeholder-host image URL added during triage and it is not a finished banner. Replace it with a real, appropriately licensed, project-specific asset or remove it before presenting that repo.

### Explicit repository disposition shortlist

| Repository | Current evidence | Portfolio action |
|---|---|---|
| `cleanhub` | Public, default branch contains only README; repository metadata reports size 0. | **Deletion candidate** after checking branches, tags, settings, and external references. |
| `Titan-Zero` | Public, default branch contains README and banner; four non-main branches hold integration work, including mobile components, device-runtime source/tests, and merge verification. | **Retain pending branch review and integration-work disposition; not a current deletion candidate.** |
| `cleanhub2` | Private, default branch contains README and Git attributes/ignore files only. | **Deletion candidate** if no unique branches/settings/references need preservation. |
| `Worksuite-Saas---Project-Management-System_Laravel` | Public, large imported third-party application; exposed env file removed from current branch, but source provenance/license and history remain to review. | **Archive/deletion review candidate; weak as original portfolio evidence.** Preserve attribution and license during review. |
| `Delivery-Management-Platform` | Public, distinct Laravel application with upstream authorship noted in README; small compared with main platform. | Keep only as a clearly attributed source/provenance archive if useful; otherwise mark for archival review. |
| `cleanly` | Private and substantial; different recursive tree from `modules`; still carries the duplicated Titan BOS README rather than a repository-specific description. | Not a duplicate finding. Keep private pending an accurate content-specific README and purpose decision. |
| `Titancore`, `Titanzero` | Substantial legacy code trees with unclear relationship to the current workforce product. | Lineage/license/build review before presenting; archive only if unique code/docs are retained elsewhere or clearly labeled. |

No repositories were deleted or archived. The table marks candidates for the owner's later disposition decision.

### Banner quality correction

The Worksuite README currently uses a placeholder external graphic, not a genuine project banner. It should not be counted as a completed banner. The portfolio requirement remains project-specific, accurate imagery with valid repository-relative or otherwise controlled asset hosting.


### Branch and release checks for placeholder candidates

- `cleanhub` and `cleanhub2` each have only their `main` branch, no tags, and no releases. These remain the strongest deletion candidates, subject to an external-reference/settings check.
- `Titan-Zero` has no tags, releases, issues, or pull requests, but it has four non-main branches with unique integration work. The branches include MobileKit components and notices, a five-tier offline device-runtime package with a test, an interaction-kernel upgrade plan, and a merge-verification record. It is **not a deletion candidate until that branch work is reviewed and dispositioned**.
- Other multi-branch repos across the account include very large branch sets. No branches were merged or deleted in this portfolio pass; they need their own per-repository branch consolidation review, with mergeability, unique commits, tests, and external references checked before cleanup.


### Active branch review — 2026-10-02

A targeted review of ten substantive repositories found active pull requests across the account. Examples include: `clean` #130–#135; `cleanly` #121, #122, #124, #126; `modules` #84, #88–#91; `TitanPro` #550, #554, #567 and other open work; current workforce PRs #1037–#1183; and `AI-Coding-Studio` #4–#25. This is a partial sample, not a complete PR inventory.

- Treat branches attached to open PRs as active review items. Do not delete them as “stale” until each PR is reviewed for mergeability, CI, unique commits, provenance, and whether its work is already on the base branch.
- Some PRs are marked WIP, depend on non-main bases, or overlap with other PRs. Maintain a per-repository queue with dependency order and canonical target rather than merging solely by branch name.
- The portfolio cleanup process therefore has two distinct tracks: (1) repository disposition candidates with no unique branch history; (2) active implementation branches that need code review, tests, and merge decisions.
- No branch or PR was merged, closed, or deleted in this pass.


## Rebranding handoff

A repository-by-repository naming map with proposed GitHub slugs, README titles, provenance notes, and disposition guidance is in [REPOSITORY-NAMING-PLAN.md](REPOSITORY-NAMING-PLAN.md). Repository names and descriptions were not changed because the connected GitHub capability here does not expose repository settings edits; the owner can apply the proposed slugs in GitHub.


### Portfolio branding pass — 2026-10-02

- Added project-specific wide SVG banner files and README references across 29 additional repositories, including prototypes and source archives. The private `cleanly` workspace also has its own banner. A follow-up fetch verified that all 30 SVG banner references point to checked-in files; Climate Crew's existing PNG header is also checked in.
- Kept the banner system consistent in layout and varied each project's title, status label, and accent color. Existing project artwork remains alongside the banner where already present.
- Left `cleanhub` and `cleanhub2` unbranded because both are near-empty deletion candidates pending disposition.
- Banner images are documentation assets; no application builds or tests were run for this visual pass.


### README accuracy and provenance pass — 2026-10-02

- Aligned remaining public README titles with the rename plan and fixed stale banner statements after adding the image assets.
- Corrected `Titan-Zero`'s default-branch content description to include its checked-in banner, and retained it for review because four non-main branches contain unique integration work.
- Corrected `cleanhub` to describe its current state: one status README, no app source or release artifact.
- Added explicit attribution notes to `ForgeMesh` and `TitanPro`: checked-in package/license metadata identifies third-party copyright/provenance that must be preserved and reviewed before claiming original authorship. The `workcore-extensions` repository has no root license file, now called out before public release.
- These changes improve README accuracy only. They do not verify functional completeness, licenses beyond the checked-in notices, or runtime behavior.

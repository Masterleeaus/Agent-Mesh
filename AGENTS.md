# Titan Zero Agent Mesh V3 — Execution Contract

## Authority

This branch family is Titan Zero. GitHub is the development authority.

- Integration branch: `titan-zero/main`
- Exact code identity: Git commit SHA
- Durable work queue: GitHub Issues with `TZ-ROADMAP-*` IDs
- Roadmap authority: `roadmap/INDEX.json` and its referenced goal files
- Dovetails/default `main` is a separate product and is not a Titan Zero development base.
- Legacy Library V2 HEAD, ZIP names, timestamps, merge numbers and conversation memory are not code authority.

## Bootstrap

Before implementation:

1. Start from current `titan-zero/main`.
2. Read this file and the applicable roadmap goal/subgoal.
3. Read the linked architecture/source references needed for that subgoal.
4. Check the matching GitHub issue and existing PRs so completed work is not repeated.
5. Work only on remaining scope.

Do not treat Dovetails canonical docs, backlog, deployment targets or product rules as Titan Zero authority merely because donor files remain in the Merge84 source tree.

## Builder workflow

- Claim one eligible Titan Zero roadmap subgoal.
- Create a dedicated branch from `titan-zero/main`, normally `goal<goal>/sg<subgoal>-<actor>`.
- Never implement directly on `titan-zero/main`.
- One user `next` means complete one useful implementation pass before reporting.
- Preserve existing proven implementation; do not rewrite working systems without evidence.
- Commit the completed pass and open/update a PR targeting `titan-zero/main`.
- Builders do not self-approve or self-merge.
- If genuinely blocked, record the blocker precisely; do not fabricate verification.

## Manager workflow

- Review the PR diff, linked roadmap subgoal and available verification.
- Reconcile overlapping work with Git.
- Merge only acceptable work into `titan-zero/main`.
- After merge, that Git commit is canonical immediately.
- Do not recreate V2 CAS/reflog/ZIP/delta-queue promotion machinery.

## Architecture invariants

- `company_id` is the only canonical company/tenant boundary. Legacy tenant fields are compatibility inputs only and normalize before authorization, persistence or execution.
- Canonical surfaces are `zero`, `go`, and `hub`; aliases normalize to them.
- Consequential mutations route through governed execution / Command Bus and accepted mutations emit Signal.
- AI, provider, model, device, surface or agent identity never grants authority.
- Offline operation never elevates authority; consequential replay is revalidated.
- Device-first and privacy-first behavior is preferred.
- Cost Sovereignty order: on-device → local/customer-hosted → BYO key/provider → customer service → Titan-managed entitled → explicit metered add-on.
- Free operation must not silently consume Titan-funded AI, telephony, SMS, storage, maps, search, vision or other metered services.
- Reuse canonical workforce/capability definitions; do not duplicate workforce specification bodies into roadmap or surfaces.
- Architecture defines the system; roadmap records remaining work and references. Do not embed full architecture specifications into roadmap files.
- Titan Code is private development tooling only. It is never a Titan Zero production runtime dependency.

## Verification

Run the narrowest relevant tests first, then applicable repository gates. Record exactly what ran and what did not.

Never claim typecheck, tests, build, integration, mobile/device, database or deployment verification unless it actually ran successfully in an environment capable of performing it.

## Merge84 bootstrap note

The current Titan Zero integration baseline was imported from the extracted Merge84 source. It contains historical/donor Dovetails naming and documentation. Those files may be implementation evidence, but they do not override this Agent Mesh contract or the Titan Zero roadmap. Convergence/removal should happen through roadmap work rather than an uncontrolled bulk rewrite.

# Agent Instructions — V3

## Bootstrap
GitHub is the development authority. Start from the repository default branch and current roadmap/work files. Do not bootstrap code authority from Library .titan HEAD, ZIP filenames, conversation memory, timestamps, or old Merge pointers.

## Builder
- Work on one claimed roadmap subgoal.
- Never commit directly to main.
- Use a dedicated branch.
- One user "next" means one complete implementation pass before reporting.
- Commit useful work frequently.
- Open/update a PR when work is ready for integration.
- If blocked, record the blocker and take another eligible subgoal when appropriate.

## Manager
- Review PR diff and CI.
- Reconcile overlapping work using Git.
- Merge only acceptable PRs.
- GitHub main is canonical immediately after merge.
- Do not reconstruct custom commits, reflogs, CAS transactions, or ZIP promotion chains.

## Architecture
Architecture defines what Titan Zero is. Roadmap defines remaining work. Code defines implementation. Evidence proves it. Do not embed architecture specifications into the roadmap.

## Invariants
- Canonical company boundary is company_id.
- Builder cannot self-approve/self-merge.
- Titan Code remains private development tooling and is not a Titan Zero production runtime dependency.

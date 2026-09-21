# Titan Zero Agent Mesh V3

Agent Mesh V3 is deliberately small.

## Authority
- GitHub `main` is the canonical code/version-control authority.
- Git commit SHA is the exact version identity.
- GitHub branches and pull requests replace custom Mesh branches, commits, CAS, reflogs, ZIP checkpoints and promotion machinery.
- Agent Mesh coordinates roadmap work; it does not reimplement Git.
- Conversation memory, filenames and timestamps are never authority.

## Worker flow
1. Read `AGENTS.md` and the relevant roadmap goal/subgoal.
2. Claim one eligible subgoal in `work/claims.json`.
3. Create/use a GitHub branch named `goal<goal>/sg<subgoal>-<actor>`.
4. Implement one complete development pass.
5. Commit and push.
6. Open/update a pull request.
7. CI verifies the PR.
8. Manager reviews and merges.
9. Merged `main` is canonical.

## Roles
Builders build on branches. Manager integrates through pull requests. No Builder self-merges.

## Releases
Human-friendly Merge numbers may be Git tags/releases. The Git commit SHA remains the exact identity.

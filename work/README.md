# Work coordination

GitHub Issues are the durable work queue. Git branches/PRs are the implementation queue.

`work/claims.json` is coordination-only and must never override GitHub issue/PR state.

## Claim
1. Pick one eligible open roadmap issue.
2. Assign it to yourself when possible.
3. Create `goal<goal>/sg<subgoal>-<actor>` from current `main`.
4. Add/update the claim only if an agent needs a machine-readable local coordination hint.

## Complete
Commit and push each complete pass. Open/update a PR linked with `Closes #<issue>`. Manager reviews CI and merges. Delete the branch after merge.

Never use ZIP promotion chains, custom CAS/reflogs, Library HEAD, filenames, timestamps, or conversation memory as Git authority.

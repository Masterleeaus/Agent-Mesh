# Actions / Agent 7 handoff

1. Merge/rebase Agent 2 runtime stream contract and wire Zero to canonical structured runtime events using the subscribe-before-dispatch pattern.
2. Merge Agent 3 workforce projection and replace conservative Zero pulse zeros with company-scoped real counts/status.
3. Bind decision cards to canonical DecisionPacket identifiers and authority evaluation from Agent 7's final authority pass.
4. Bind Agent 5 structured execution results/errors; never convert acknowledgement into success.
5. Reconcile Agent 1 SQLite persistence with conversation-state runtime; no PostgreSQL/Redis dependency for Zero.
6. Add server route/persistence for chat messages if not supplied by Agent 2; reuse Interaction Engine conversation state.
7. Add stop/cancel/redirect controls by invoking canonical runtime/workforce commands.
8. Add offline queue semantics only for explicitly safe local interactions; remote actions must remain pending/unexecuted offline.
9. Reconcile navigation to Chat/Control/Workforce/Decisions/System after existing route tests are evaluated.
10. Run full web/titan-platform gates in a shell-capable environment.

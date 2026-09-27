# Adapter Session Recovery

Pass 7 hardens adapter reconnection after navigation, reload, restart, or transport disconnect.

Key rules:
- `company_id` is immutable across a recoverable session.
- A company mismatch is never recovered in place.
- Runtime identity or adapter-version changes require a new session.
- Navigation changes and stale-but-resumable sessions increment the session epoch.
- After navigation/staleness, the prior authority snapshot is deliberately cleared.
- Recovery requires fresh adapter negotiation and fresh authority evaluation.
- Reconnect planning never auto-executes work.
- A current session may resume only when its company, navigation key, runtime, version, and freshness remain valid.

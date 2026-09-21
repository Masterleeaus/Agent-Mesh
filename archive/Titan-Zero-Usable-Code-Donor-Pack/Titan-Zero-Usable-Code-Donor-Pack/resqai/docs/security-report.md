# Security Report

Security analysis of the ResQAI platform:
- Lemma SDK handles authentication and token management
- Auth redirect flow on localhost has known issues (blocked by upstream fix)
- All table permissions configured via per-agent `permissions.json`
- `operations_log` provides audit trail for all mutations
- `.env` files gitignored — no secrets in repository

See `docs/09_Reports/SECURITY_AUDIT.md` for detailed security audit.

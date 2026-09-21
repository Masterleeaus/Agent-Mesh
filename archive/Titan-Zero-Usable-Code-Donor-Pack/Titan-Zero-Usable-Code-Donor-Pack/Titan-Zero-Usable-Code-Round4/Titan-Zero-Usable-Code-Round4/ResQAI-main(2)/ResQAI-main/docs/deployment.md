# ResQAI — Deployment

## Current Status

**No deployment infrastructure configured.** The `infrastructure/` directory is reserved for future deployment configuration (Docker, CI/CD, cloud provisioning).

## Build Artifacts

Each application produces a static Vite build in its `apps/*/dist/` directory:

| App | Build Output |
|-----|-------------|
| support-queue | `apps/support-queue/dist/` |
| crm-tracker | `apps/crm-tracker/dist/` |
| ops-dashboard | `apps/ops-dashboard/dist/` |
| appointment-board | `apps/appointment-board/dist/` |
| resolution-center | `apps/resolution-center/dist/` |

These directories contain self-contained HTML/CSS/JS bundles ready for static hosting.

## Hosting Options (Future)

- **Static file server** — Serve each `dist/` folder via Nginx, Apache, or similar
- **Docker** — Containerize each app with a lightweight web server (see `infrastructure/`)
- **Lemma surfaces** — Deploy apps as Lemma pod surfaces (requires platform support)

## CI/CD (Future)

No CI pipeline exists. Recommended additions:
- GitHub Actions for pull request validation (type-check, lint, test)
- Automated build and deploy pipeline
- Environment-specific configurations (dev/staging/production)

## Environment Configuration

Each environment (dev/staging/prod) requires:
- A Lemma pod ID
- Lemma API and auth URLs
- Proper OAuth client configuration

Build-time environment variables are injected via Vite's `import.meta.env`. See `docs/setup.md` for the full variable reference.

---

## Deployment Summary

*Derived from `docs/deployment-summary.md` (archived).*

### Resource Status
| Resource Type | Total | Ready | Blocked |
|--------------|-------|-------|---------|
| Workflows | 8 | 8 (deployed) | 8 (no agent runtime harness) |
| Functions | 10 | 10 | 0 |
| Agents | 6 | 6 (deployed) | 6 (no runtime harness) |
| Tables | 9 | 9 | 0 |
| Apps | 5 | 5 | 0 |

### Known Gaps
| Gap | Impact | Priority |
|-----|--------|----------|
| No agent runtime harnesses | All agent-connected workflows fail at runtime | P0 — blocking |
| `support-reply-drafter` unreferenced | No workflow uses this agent | P2 |
| No connectors deployed | No external integrations (email, Slack) | P2 |
| No surfaces deployed | No customer-facing portals | P3 | 

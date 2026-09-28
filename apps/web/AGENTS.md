# AGENTS — apps/web

## Design Context

This app has committed design context. Read it before changing UI:

- **[PRODUCT.md](PRODUCT.md)** — strategic: register (`product`), users (Owner/Admin, Office, Technician), purpose, the **Sturdy · Direct · Earned-trust** operational personality, anti-references, and the core design principles (field-first one-tap; the tool recedes; one record feeds every function; honest state/trustworthy money; intelligence with visible authority). Accessibility target: **WCAG 2.2 AA + field legibility**.
- **[DESIGN.md](DESIGN.md)** — visual: the Titan Zero system (black/slate foundations with Command orange and reserved operational status colors; legacy token names stay `forest-*` temporarily for compatibility), typography, elevation, components, and Do's/Don'ts. Tokens are authoritative; the live source is `app/styles/tokens.css` and the P7 components in `components/ui/`.
- **`.impeccable/design.json`** — machine-readable sidecar (tonal ramps, shadow/motion tokens, drop-in component snippets).

North Star: **Titan Zero is an operational Advanced Intelligence system, not another dashboard.** Command orange is earned (≤10% of a screen); status hues never decorate; one typeface; flat-by-default surfaces. Canonical surface IDs are **Zero, Go, and Hub**. “Command” may remain an owner/manager presentation label for Zero, but it is not a fourth canonical surface or authority identity.

## Blueprint v3 web boundary

`apps/web` is the full Titan TypeScript base web application and retains mature native AI-FSM field-service capabilities. It must not duplicate canonical Interaction, Decision, Workforce, Authority, Execution or Evidence runtimes. It is distinct from the single three-mode PWA. Read `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md` and `docs/architecture/CANONICAL-RULES.md` before changing API routes, persistence, Workforce, authority, execution or evidence behavior.

- Consequential mutations must converge on canonical domain services plus the hosted Workforce/governed execution path; a role check, app-local risk assessment, audit row or internal HTTP fetch is not a substitute for effective authority + ExecutionGateway + observed verification.
- The canonical Workforce runs persistently on the server. Web projects/interacts with it; closing the browser must not stop delegated work.
- Preserve mature native FSM business behavior in `apps/web`; extract reusable domain contracts/rules to canonical packages/services where appropriate rather than duplicating them in routes.
- Persistence is **owner-specific**, not universally SQLite-first. Native FSM persistence remains Titan-owned and must be made installable and company-safe without Frappe; runtime/control/evidence/local state follows #811/#913/#646. Frappe #1051 is an optional extension provider with per-company sites when enabled. Converge routes through Titan Domain/provider contracts without deleting useful native FSM behavior.
- Provider acknowledgement and HTTP success are not verified business outcomes.
- Preserve `company_id` as the canonical architecture boundary. Legacy `account_id` storage/schema fields are compatibility/domain persistence details and must be normalized at canonical boundaries rather than becoming a second tenancy model.

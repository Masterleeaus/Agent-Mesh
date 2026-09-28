# AGENTS — apps/web

## Design Context

This app has committed design context. Read it before changing UI:

- **[PRODUCT.md](PRODUCT.md)** — strategic: register (`product`), users (Owner/Admin, Office, Technician), purpose, the **Sturdy · Direct · Earned-trust** operational personality, anti-references, and the core design principles (field-first one-tap; the tool recedes; one record feeds every function; honest state/trustworthy money; intelligence with visible authority). Accessibility target: **WCAG 2.2 AA + field legibility**.
- **[DESIGN.md](DESIGN.md)** — visual: the Titan Zero system (black/slate foundations with Command orange and reserved operational status colors; legacy token names stay `forest-*` temporarily for compatibility), typography, elevation, components, and Do's/Don'ts. Tokens are authoritative; the live source is `app/styles/tokens.css` and the P7 components in `components/ui/`.
- **`.impeccable/design.json`** — machine-readable sidecar (tonal ramps, shadow/motion tokens, drop-in component snippets).

North Star: **Titan Zero is an operational Advanced Intelligence system, not another dashboard.** Command orange is earned (≤10% of a screen); status hues never decorate; one typeface; flat-by-default surfaces. Canonical surface IDs are **Zero, Go, and Hub**. “Command” may remain an owner/manager presentation label for Zero, but it is not a fourth canonical surface or authority identity.

## Blueprint v3 web boundary

`apps/web` is a surface/BFF and must not own a second business runtime. Read `docs/architecture/TITAN-ZERO-BLUEPRINT-V3.md` and `docs/architecture/CANONICAL-RULES.md` before changing API routes, persistence, Workforce, authority, execution or evidence behavior.

- Consequential mutations must converge on canonical domain services plus the hosted Workforce/governed execution path; a role check, app-local risk assessment, audit row or internal HTTP fetch is not a substitute for effective authority + ExecutionGateway + observed verification.
- The canonical Workforce runs persistently on the server. Web projects/interacts with it; closing the browser must not stop delegated work.
- New business/domain logic belongs in canonical packages/services, not `app/api/**` or `lib/**` merely for convenience.
- `apps/web` remains the **full native Titan FSM base application**. Its mature field-service persistence and behavior are not legacy merely because Frappe exists. Converge PostgreSQL-only assumptions and duplicated Titan runtime mechanisms toward supported storage/contracts without deleting native FSM capability. Frappe/#1051 is optional extension-provider infrastructure for deliberately delegated capabilities; surfaces must not bind directly to Frappe DocTypes/databases.
- Provider acknowledgement and HTTP success are not verified business outcomes.
- Preserve `company_id` as the canonical architecture boundary. Legacy `account_id` storage/schema fields are compatibility/domain persistence details and must be normalized at canonical boundaries rather than becoming a second tenancy model.

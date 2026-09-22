# #636 — Titan Go, Hub and Command application masters

## Pass 1 — canonical/donor topology audit

### Repository findings
- `apps/web` is the current web application package.
- No `apps/mobile` package exists at the expected path on the current branch.
- Titan platform descriptor exposes shared runtime/workforce/intelligence/business-ops facades; application projections must not become domain authority.
- No new app core was created in this pass.

### Verified Library donor/reference findings
- Titan Go Master v1.10.0 is a verified donor. Its presentation/navigation code projects field-worker state rather than owning business logic.
- Titan Hub Master v1.0.0-alpha.8 is a verified donor. It provides a customer-safe mobile shell, semantic cards, chat thread and governed intents.
- Titan Zero PWA checkpoint PWA17 contains the newer chat-first role shell, generated-UI envelope and three-card presentation pattern, but is checkpoint evidence rather than canonical authority.
- Interaction Engine and Interface Runtime remain the presentation-contract authorities; Go/Hub are projections.
- Library migration evidence conflicts with older standalone-Command packaging: the newer target architecture says base/Zero is the owner/Command experience, Hub and Go are the provisionable PWAs, and Command must not become a separate app core.

### Convergence rule
Use the repository's canonical surface/runtime authorities first. Import only missing Go/Hub/owner presentation/navigation semantics. Preserve maps. Do not recreate the PHP mobile suite, create a duplicate Command PWA, or let generated UI/navigation become business-state/execution authority.

### Next audit
Locate the actual current web/PWA surface implementation and navigation/component files in the repository, then compare them to Go/Hub/PWA17 semantics before changing code.

## Pass 2 — live-surface location and product-spec reconciliation

GitHub directory probes confirm `apps/web/app`, `apps/web/app/titan` and `apps/web/components` exist, while default-branch code search currently returns no indexed hits for the expected PWA17 filenames. This means absence from search is not evidence that the surface implementation is absent; direct-path/repository inspection must remain authoritative.

Library PWA build-plan evidence provides the expected canonical TypeScript layout:
- `app/titan/components/role-chat.tsx`
- `app/titan/components/generated-ui/*`
- `app/titan/runtime/surface-contract.mjs`
- `app/titan/components/role-details.tsx`
- `app/titan/components/role-secondary-surfaces.tsx`
- `app/titan/components/app-surfaces.tsx`
- `app/titan/components/workforce-surface.tsx`
- Go field runtime and schedule intelligence
- Hub service runtime
- Command decision runtime
- PWA identity/offline/sync runtime

The frozen navigation target in the PWA plan is:
- Go: Chat / Active / Schedule / Comms / Ready
- Hub: Chat / Service / Comms / Account
- Command(owner/base): Chat / Pending / Operations / Workforce / System

This is close to, but not identical with, later product wording. Navigation labels must therefore be reconciled against the current repository implementation before any donor copy is made. Maps remain explicitly preserved.

No code was copied from the PHP donors or the merge-pending PWA checkpoint in this pass.

## Pass 3 — direct live implementation audit

Direct branch reads confirm substantial PWA17-era implementation is already present under `apps/web/app/titan`; donor re-import would duplicate working systems.

Confirmed live code:
- `components/role-chat.tsx`: one chat-first shell for canonical `zero | go | hub`, company-scoped interaction/conversation state, generated UI, multimodal input, stream interruption/resume.
- `components/role-details.tsx`: field job/detail workflow consuming the existing Go field and schedule runtimes.
- `components/role-secondary-surfaces.tsx`: Go dispatch/team communications, Hub support, account/readiness/settings projections.
- `runtime/go-field-runtime.mjs`: governed field transitions, offline queue, receipt application, cross-company/revision/device revalidation, issue signals.
- `runtime/go-schedule-intelligence.mjs`: authority-neutral schedule risk/recovery intents.
- `runtime/surface-contract.mjs`: company-scoped surface projections and Command Bus intents; mutations require server acceptance/receipts and explicitly do not self-authorise.

Important convergence defects/gaps found:
1. The runtime presentation registry uses the key `command`, while `RoleChat` and the canonical surface model use `zero`. This is an internal surface-key mismatch and must normalize Command presentation to canonical `zero`, not establish `command` as a second authority boundary.
2. Expected standalone `hub-service-runtime.ts` and `command-decision-runtime.ts` from the older build plan are absent. This is not automatically a gap: Hub and owner behavior already exist in shared surface/chat components and should only gain separate runtime modules if concrete missing semantics require them.
3. Expected `app-surfaces.tsx` and `workforce-surface.tsx` filenames are absent at probed paths. Existing role components may have superseded them; do not recreate them by filename alone.
4. Go maps/navigation capability is already explicitly present as `maps.navigate`; maps must be retained.

Decision: next implementation pass should fix the canonical `zero`/Command presentation-key mismatch with regression coverage before considering any donor feature import.

## Pass 4 — canonical owner surface normalization

Fixed the concrete owner-surface mismatch in `surface-contract.mjs`:
- internal owner presentation/capabilities now use canonical `zero`
- user-facing product name remains `Titan Command`
- `command` is not accepted as a second canonical surface boundary
- owner mutations remain authority-neutral Command Bus intents requiring server acceptance and receipts
- Go `maps.navigate` capability remains intact

Added focused Node regression coverage in `runtime/surface-contract.test.mjs`.

## Pass 5 — legacy shell vs canonical PWA convergence audit

A second live application shell exists at `apps/web/components/AppShell.tsx` and `apps/web/app/app/*`. It is a mature legacy/office field-service UI with sidebar hubs and mobile shortcuts such as Overview/My Day/Capture/Work/People/Money. It is not the same information architecture as the chat-first Titan Go/Hub/Command surface under `app/titan`.

Key findings:
- `/app` still opens the legacy owner dashboard and AppShell rather than the chat-first owner/Command projection.
- Tech navigation still exposes My Day/Visits rather than the target Go Chat/Active/Schedule/Comms/Ready shell.
- No standalone `/go`, `/hub` or `/command` routes were found at the expected root paths.
- The marketing site links “Open Command” to `/app`, which currently lands on the legacy dashboard.
- The legacy shell contains substantial useful domain workflows and must not be deleted or rewritten; these should become destinations/projections behind the chat-first role shells.
- This confirms #636 is a convergence/routing problem, not a need to import another app core.

Implementation rule: preserve the existing domain pages and mature AppShell functionality, but make canonical Zero/Go/Hub chat-first surfaces the primary role entry experience and expose legacy domain pages as secondary destinations. Do not create a fourth app or duplicate business logic.

## Pass 6 — entry-point trace

Direct branch inspection resolves the apparent `app/titan` ambiguity:
- the Titan PWA component/runtime files exist and are substantial,
- but there is no routable `apps/web/app/titan/page.tsx` or `layout.tsx`,
- and no root `/go`, `/hub`, `/command` or `/titan/{go,hub,zero}` pages were found.
- repository search also finds no current caller mounting `RoleChat`, `RoleDetails` or the role secondary-surface components.

Therefore the canonical chat-first implementation is currently **orphaned presentation code**, not an active application entry surface.

Meanwhile `/app` is an authenticated server-rendered owner/field application backed by real database workflows. Replacing that route with the demo projection would be unsafe because the current Titan PWA components still call `getDemoSurfaceProjection()` with `demo_001` and prototype data.

Convergence requirement:
1. do not redirect production `/app` to demo-backed components;
2. first extract/mount a role-shell entry seam that can receive real authenticated `company_id`/actor/projection data;
3. preserve existing `/app/*` workflows as secondary destinations;
4. then route owner/worker/customer entry points into the shared shell without duplicating business logic.

This changes the immediate implementation priority from “routing” to “remove demo-only entry dependency / establish injectable surface projection seam.”

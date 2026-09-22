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

## Pass 7 — authenticated projection injection seam

Implemented the first production-safe convergence seam without changing existing `/app` routing:
- added `createSurfaceProjection(...)` to build canonical `zero|go|hub` projections from explicit `company_id`, actor, revision and lifetime inputs;
- legacy tenant keys are rejected before projection creation;
- projections remain authority-neutral and identity/cached state never grant authority;
- the demo projection now delegates to the same canonical constructor rather than maintaining a parallel shape;
- `RoleChat` now accepts an injected projection and rejects role/projection mismatches, while retaining demo fallback for the isolated prototype path;
- added regression coverage for explicit company/actor injection and legacy tenant rejection.

This enables a server-authenticated entry component to derive `company_id` from the existing session/account boundary and inject it into the chat-first surface without embedding session/database logic in the presentation runtime.

## Pass 8 — authenticated session-to-surface binding

Connected the existing authenticated session model to the canonical Titan surface contract without changing production routes:
- owner/admin sessions normalize to canonical `zero`;
- tech sessions normalize to canonical `go`;
- the existing authenticated `accountId` is injected as canonical `company_id`;
- authenticated `userId` becomes the projection actor;
- role holders cannot self-select another canonical surface;
- resulting projections remain authority-neutral and short-lived by default.

Added `runtime/authenticated-surface.ts` and focused tests. Hub is intentionally not derived from the internal staff session roles because customer authentication is a separate boundary and must be wired from its real customer session rather than inferred.

The production shell can now obtain a company-scoped Zero/Go projection from the existing session without demo identity leakage. Routing remains unchanged until the actual shell mount is added.

## Pass 9 — first authenticated chat-first mount

Mounted the first production-authenticated chat-first surface without replacing existing workflows:
- added `/app/command` as an authenticated owner/admin Command entry;
- tech sessions fail closed back to their field route rather than receiving owner Command;
- the page creates a short-lived `zero` projection from the authenticated session and injects it into `RoleChat`;
- added a small client wrapper so “View details” returns to the existing operational `/app` destination rather than duplicating owner workflows;
- `TitanRole` now reuses the canonical surface type rather than maintaining a separate string union.

This is intentionally additive. The existing `/app` dashboard remains untouched while the authenticated chat-first surface is proven. No demo company identity is used by the mounted Command entry.

## Pass 10 — authenticated Go primary entry

Mounted the field-worker chat-first entry and made it the default field landing path:
- added authenticated `/app/go`;
- only `tech` sessions can enter Go; non-tech staff are redirected to Command;
- Go receives a short-lived authenticated `go` projection using session `company_id`/actor context;
- the existing `/app/my-work` implementation remains the operational detail destination behind Go;
- changed the existing `/app` tech redirect from `/app/my-work` to `/app/go`.

This establishes the intended “chat first, workflows behind it” pattern for field staff without rewriting scheduling, work orders, visits, location capture, maps/navigation or field-day business logic.

## Pass 11 — primary navigation convergence

Converged the existing AppShell entry/navigation model around the canonical chat-first surfaces while retaining legacy operational destinations:
- owner/admin desktop Home now points to `/app/command` and is labelled Command;
- owner/admin mobile primary home now points to Command;
- sidebar brand/home routes owner/admin to Command and tech to Go;
- tech navigation now exposes Go as the primary entry and Active as the existing field-work destination;
- tech attempts to open Command are redirected to `/app/go`;
- existing Work/People/Money, My Work, Visits, Day Review, Settings and other operational pages remain available.

This makes the chat-first surface the navigation home without deleting or cloning the mature business workflow routes.

## Pass 12 — authenticated/demo presentation separation

Removed remaining demo transcript/status leakage from the mounted authenticated Command and Go chat surfaces:
- `RoleChat` now has an explicit demo mode, defaulting to demo only when no projection is supplied;
- authenticated wrapper explicitly sets `demo={false}`;
- canned demo conversation history is no longer rendered for authenticated sessions;
- authenticated surfaces no longer label themselves “Live demo data”, “Prototype” or “Demo CRM”;
- demo fallback remains available for isolated prototype/demo rendering.

This does not yet claim that all generated cards contain live business data: several role-specific card bodies are still prototype content and must be replaced by injected live projections before they are represented as live operational facts.

## Pass 13 — fail closed on prototype business facts

Hardened authenticated Command/Go so prototype business values are no longer presented as live facts:
- authenticated mode no longer creates `demoPresentationIntent` cards;
- authenticated initial response is neutral and directs users to live interaction or existing operational details;
- when the authenticated interaction runtime returns no structured/live message, the UI explicitly says no business facts were inferred;
- prototype generated UI remains available only in explicit demo mode;
- authenticated generated-card area now waits for live runtime output rather than rendering hard-coded operational values.

This removes the highest-risk presentation mismatch while preserving the generated-UI contract for later live projection wiring.

## Pass 14 — interaction transport truthfulness

Audited the mounted chat interaction path and found no production `InteractionTransport` implementation wired into `RoleChat`. The client previously synthesized the user's own message as an accepted interaction event when no transport existed, which could make an unwired runtime look partially live.

Hardened the canonical interaction client:
- no configured transport now returns no server events;
- it no longer fabricates a scoped accepted interaction event;
- authenticated RoleChat therefore falls through to the explicit “no live structured response” state added in Pass 13;
- local optimistic conversation state remains available, but is not evidence of server acceptance or AI output.

A real production transport remains required before Command/Go chat can claim live AI responses.

## Pass 15 — interaction boundary regression coverage

Added focused regression coverage for the hardened interaction boundary:
- canonical alias normalization is covered (`command/owner → zero`, `field → go`, `customer → hub`);
- no-transport behavior is asserted fail-closed;
- returned transport events are filtered by exact `company_id`, conversation and canonical surface;
- legacy tenant authority is rejected at the interaction boundary.

The test file is committed as coverage evidence, but was not executed in this connector-only pass; CI/runtime execution remains required before claiming it passes.

## Pass 16 — prototype detail/secondary surface containment

Audited Go/Hub detail, inbox and settings surfaces and confirmed they still embed prototype identities and operational facts, including demo company/customer names, job IDs, addresses, access codes, staff names, schedules, payment amounts and static messages.

Added explicit containment:
- `RoleDetails` accepts a demo flag and, in authenticated non-demo use, refuses to render prototype Go/Hub records;
- authenticated non-demo detail state explains that prototype records are hidden and directs live data to the existing operational workspace;
- `RoleInbox` and `RoleMore` now return the supplied canonical/live command node in non-demo mode rather than rendering static demo messages/settings;
- demo rendering remains available for prototype/marketing contexts.

No prototype job/customer/access/payment record should be promoted into authenticated operation through these components until a real scoped projection is injected.

## Pass 17 — Go navigation convergence

Converged the staff shell toward the canonical Go information architecture without creating another app:
- Go primary entry is labelled **Chat** and remains `/app/go`;
- existing field workflow is labelled **Active** and retains `/app/my-work` plus visits as its active prefix;
- desktop Go navigation now exposes **Schedule · Today**, **Comms · Dispatch**, and **Ready · Field Kit** using existing mature routes rather than duplicate pages;
- owner field-home wording is also normalized from My Day to Active;
- mobile keeps the compact Chat + Active primary pair while the existing More/shell navigation retains secondary operational reachability.

This is route/label convergence only; it deliberately reuses the mature field-service routes.

## Pass 18 — Command navigation convergence

Converged owner/admin desktop navigation toward the canonical Command IA without inventing duplicate application cores:
- **Chat** → authenticated `/app/command`;
- **Control** → mature live owner dashboard `/app`;
- **Workforce** → existing settings surface, which already loads company-scoped workforce lifecycle/hierarchy inspection;
- **Decisions** → existing live requests/attention workflow pending a dedicated canonical decision projection;
- **System** → existing authenticated settings/system surface.

Existing Work/People/Money sections remain reachable beneath Command. Owner field mode still uses the field navigation rather than duplicating Command there.

This is deliberately a reuse/convergence pass: no parallel Control, Workforce, Decisions or System implementations were created.

## Pass 19 — Hub authentication boundary

Audited the current web app for a real customer/Hub session or portal boundary. None was found. The existing `fsm_session` resolves staff users and active business memberships with owner/admin/tech roles, so it must not be reused to infer customer identity.

Hardened the authenticated surface adapter:
- added an explicit Hub fail-closed boundary;
- staff authentication cannot construct an authenticated Hub projection;
- Hub requires a future independently verified customer-auth adapter carrying the correct company/customer actor context;
- added regression coverage asserting that the staff path cannot derive Hub.

No fake Hub route or customer session was introduced. Prototype Hub UI remains isolated until the real customer identity boundary exists.

Test coverage is committed but was not executed in this connector-only pass.

## Pass 20 — PWA identity split

Audited installability metadata. The web app had one generic Titan Zero manifest starting at `/app`, which conflicts with the product rule that provisionable PWAs are Go and Hub while Command remains the owner/base surface.

Added dedicated manifest endpoints:
- **Titan Go** starts at `/app/go` and is bound to the authenticated Go entry;
- **Titan Hub** reserves the customer PWA identity at `/hub`, but no Hub page/auth route was fabricated; customer authentication remains blocked by Pass 19.

Both use the dark slate theme and existing icon assets. No Command-specific PWA was created.

The generic root manifest remains for compatibility in this pass; removing or repurposing it should be done only after checking current install/service-worker dependencies.

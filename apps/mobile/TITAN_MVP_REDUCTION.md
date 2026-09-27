# Titan Mobile MVP reduction

Base: standalone ProKit Home Service app.

## Active MVP shell
- `lib/main.dart`
- `lib/screens/splash_screen.dart`
- `lib/screens/titan_shell_screen.dart`
- existing theme/store/utilities while the shell is stabilized

## Interaction model
The permanent primary surface is conversation-first:
1. three contextual cards
2. generative UI/content region
3. composer with attachment, voice and send affordances

No permanent Home/Search/Bookings/Account tab bar is used.

## Legacy quarantine
The original marketplace fragments, components and screens are retained temporarily under `lib/legacy/` so useful booking, job, payment, provider, review and service widgets can be converted before deletion. They are not reachable from the MVP shell.

## Next implementation targets
1. Define typed generative UI component contract.
2. Convert Active Booking -> Job Card.
3. Convert Order Summary -> Job/Quote/Invoice Summary.
4. Convert Provider -> Worker Card.
5. Convert Subscription -> Recurring Service Card.
6. Wire composer to Titan backend/capability router.
7. Add voice/attachments/device capabilities.
8. Delete legacy marketplace code after conversions are complete.

## Pass 2 — typed generative UI
- Added `TitanGenerativeItem` typed UI contract with job, worker, summary, recurring-service and notice types.
- Added a single renderer (`TitanGenerativeCard`) so backend/agents can request UI without navigating to fixed screens.
- Converted Home Service concepts into generic Titan primitives rather than coupling to legacy models.
- Added a temporary local demo adapter to exercise the contract before API integration.
- Context cards now execute prompts; generated actions feed back into the same conversation loop.
- Legacy Home Service remains isolated under `lib/legacy` for later extraction/deletion.

## Pass 3 — full-screen capability preservation

Titan is conversation-first, not conversation-only. Full-screen task surfaces are retained where spatial or capture workflows need room.

Implemented now:
- `TitanMapScreen`: full Google Maps job surface with job markers, marker detail card, traffic, map type switcher and fit-to-jobs control.
- Conversational routing: map/where/route intents can open the map from the Titan shell.
- Map context shortcut in the shell for MVP testing.
- Device-capability dependencies reserved in `pubspec.yaml` for camera, image picker, location, signature, QR generation and document scanning.

Capability retention policy:
- GENERATIVE COMPONENT: job/customer/worker/invoice/approval/status/form/summary.
- FULL PAGE: maps/routes, camera/scanner, signature, calendar/dispatch, documents, dense analytics.
- DEVICE CAPABILITY: location, camera, photos/files, microphone, notifications, biometrics.
- DELETE: marketplace/demo navigation and duplicate fixed screens once useful primitives are extracted.

The original ProKit map sample was not copied blindly: much of its implementation is commented out due to old geocoder/null-safety constraints. Titan uses a small current null-safe map page instead.

## Pass 4 — field capability wiring
- Jobs Map can request current device location and center on the user.
- Selected jobs expose external turn-by-turn navigation handoff.
- Added Job Evidence full-screen capability for camera photos, multi-page document scanning and signatures.
- Conversation routing can invoke maps/navigation or evidence capture without permanent navigation tabs.
- Android camera/location permissions declared.
- Captured evidence remains local in this MVP; Titan authenticated upload/offline queue is the next backend integration boundary.

## Pass 5 — Titan boundary + offline command foundation
- Added canonical mobile session envelope: `company_id`, `actor_id`, `device_id`, surface.
- Added `TitanGateway` so UI no longer directly calls the demo response engine.
- Added capability registry with generative/full-page/device presentation and offline/online policy flags.
- Added idempotent local command queue foundation for offline-queueable mutations.
- Local MVP gateway remains the adapter until authenticated Titan API/Command Bus endpoints are connected.
- SharedPreferences queue is intentionally temporary; production must replace it with encrypted device storage.

## Pass 6 — job-linked evidence + sync state
- Job generative cards now carry typed context (`job_id`, coordinates/address) and expose Map, Navigate and Evidence actions.
- Generated actions invoke full-screen capabilities directly instead of being converted back into vague text prompts.
- Evidence capture is explicitly bound to a job ID.
- Photos, scanned pages and signatures become `TitanEvidenceItem` records with queued/syncing/synced/failed states and retry metadata.
- Signatures are serialized to PNG files before queueing.
- Evidence metadata is sent through `TitanGateway.command('job.evidence.attach', ...)`, preserving the Command Bus boundary and idempotent offline queue.
- Binary upload remains a transport responsibility for the authenticated Titan API; local file paths are never treated as server URLs.
- Production still requires encrypted local persistence and server-side authorization/revalidation on sync.

## Pass 7 — Schedule & Dispatch
- Added a full-screen Schedule & Dispatch capability launched from chat/generative actions.
- Added seven-day day selector and chronological job timeline.
- Added worker assignment/reassignment and rescheduling flows.
- Dispatch and reschedule mutations go through TitanGateway and the offline command queue.
- Registered schedule.view, schedule.reschedule and dispatch.assign in the capability registry.
- Added Schedule contextual shortcut while retaining conversation-first navigation.


## Pass 8
- Added full-page operational Job Detail.
- Added start travel / arrived / start job / complete job state progression.
- Added customer call and SMS device actions.
- Added job notes and checklist commands.
- Added direct evidence capture from job detail.
- Schedule entries now open Job Detail.
- Generated job cards now expose Open job.
- Registered new job/customer capabilities in capability registry.


## Pass 9
- Added commercial lifecycle full page.
- Added quote send and customer approval commands.
- Added completion → invoice creation → payment recording flow.
- Added quote/invoice/payment generative types and capability registrations.
- Job Detail now opens the commercial flow without permanent navigation.


## Pass 10
- Added customer record/address/contact-history models.
- Added full-page customer context invoked from generative UI.
- Added call, SMS and email device actions.
- Added multiple service-address presentation and address selection command.
- Added generative customer card/type.
- Kept customer CRM behind conversation; no permanent Customers tab.

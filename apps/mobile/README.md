# Titan Zero Mobile

Canonical shared Flutter source for Titan Zero mobile on iOS and Android.

## Surfaces
- **Command** — user-facing owner/manager label; canonical runtime surface `zero`.
- **Go** — canonical field-worker surface `go`.
- **Hub** — canonical customer surface `hub`.

One Flutter source owns mobile presentation. Titan Core remains authoritative for business state, capabilities and consequential execution. `company_id` is the sole tenant boundary. Device, actor or surface identity never grants authority.

## Architecture
Production mobile contracts mirror the canonical Surface SDK in `packages/titan-platform/src/surface/`. Flutter projections are authority-neutral and commands require server acceptance/receipts. Existing Pass56–60, SG07 and SG08 Edge/offline/storage/release work is preserved.

## Legacy quarantine
`lib/legacy/` is donor UI retained temporarily for parity/reference only. It is excluded from static analysis and must not be used for new Titan Zero business logic. Remove it after parity is verified.

## Build
Standard Flutter metadata is kept at this root so both `android/` and `ios/` build from this same source. Release signing/store work remains tracked separately in Goal 47 SG09.


## Production Surface SDK bootstrap

The canonical mobile shell does not grant itself business authority. Production builds inject a server-backed Surface SDK gateway at bootstrap.

Required Dart defines:
- `TITAN_COMPANY_ID`
- `TITAN_ACTOR_ID`
- `TITAN_DEVICE_ID`
- `TITAN_SURFACE` — canonical `zero`, `go`, or `hub` (defaults to `zero`)
- `TITAN_SURFACE_PROJECTION_URL`
- `TITAN_SURFACE_COMMAND_URL`

Optional:
- `TITAN_AUTH_TOKEN`

Missing production configuration fails closed. `LocalMvpTitanGateway` is development/offline compatibility only and is not wired into the production shell. Core projections remain authority-neutral and consequential commands require server acceptance/receipts.

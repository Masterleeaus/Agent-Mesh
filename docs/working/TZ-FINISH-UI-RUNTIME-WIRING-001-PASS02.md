# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 02

## Outcome

Completed standalone navigation/deep-link closure without changing the visual shell.

## Changes

- Added `titan.zero.standalone-navigation.v1` as an app-local navigation truth layer over the shared Business Ops URL sanitizer.
- Bound deep-link validation to the generated Merge55 reachability inventory, so post-login redirects only target pages that actually exist in the standalone build.
- Added deterministic matching for static and dynamic App Router pages with static-route precedence over dynamic siblings.
- Canonicalised the retained `/app/my-day` compatibility path to `/app/my-work` while preserving query parameters.
- Updated post-login and unauthenticated round-trip resolution to reject stale/dead `/app/...` targets instead of landing on a 404.
- Preserved the existing AppShell visual system and role/workspace behavior.

## Verification

- Focused TypeScript compile of changed navigation/auth modules: PASS.
- Runtime assertions against actual transpiled source: 8/8 PASS.
- Route templates loaded from Pass 1 inventory: 60 standalone `/app` templates.
- Verified dynamic entity links, static-over-dynamic precedence, legacy alias canonicalisation, query preservation, dead-path rejection, external-target rejection and existing role home fallbacks.

## Authority / safety

Navigation reachability grants no business authority. Existing session, role, page and service authorization remain authoritative. External/non-app redirects fail closed.

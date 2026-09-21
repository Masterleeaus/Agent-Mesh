# TZ-FINISH-UI-RUNTIME-WIRING-001 — Pass 10

Final UI/runtime convergence pass against Manager Merge62 plus cumulative Builder 2 work.

## Dead wiring cleanup

Removed `STANDALONE_ROUTE_ALIASES` from `standalone-navigation.ts`. The export had zero consumers after Pass 4 centralised compatibility behavior in `compatibility-routes.ts`. The retained `/app/my-day` page and compatibility registry remain because they preserve existing bookmarks/deep links and therefore are not dead.

No page route was deleted solely because it has zero literal inbound links: dynamic, bookmarked, external, API-driven and permission-redirect entry points are not safely proven dead by static inbound counts.

## Final reachability matrix

Published `apps/web/lib/navigation/final-reachability-matrix.generated.json` covering all 75 page routes and 227 route handlers, plus compatibility, boundary, offline, state and native-service reachability metadata.

Final invariants: 0 unresolved literal internal targets, 0 known dead page paths, 1 intentional compatibility redirect, 20 loading boundaries, 1 app error boundary, and 9/9 declared native-service surfaces ready.

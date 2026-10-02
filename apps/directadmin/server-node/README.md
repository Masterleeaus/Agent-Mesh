# Titan Server Node DirectAdmin surface

This plugin package currently includes a bounded, read-only health bridge in `runtime.mjs`. It binds to loopback only and checks the native Titan web health endpoint and the canonical Workforce `/ready` endpoint. It reports liveness separately from dependency readiness and never exposes dependency URLs or raw exception messages.

Run the local bridge with `node apps/directadmin/server-node/runtime.mjs`. Defaults are `127.0.0.1:3099`, web `127.0.0.1:3000/api/health`, and Workforce `127.0.0.1:3010/ready`. Ports may be configured with `TITAN_SERVER_NODE_PORT`, `APP_PORT`, and `WORKFORCE_PORT`. Optional `TITAN_SERVER_NODE_DEPENDENCIES` must be JSON containing loopback HTTP health targets only, with a maximum of 16 dependencies per status request.

- `GET /healthz` reports process liveness.
- `GET /v1/status` probes configured dependencies and reports readiness.
- Other paths return 404; non-GET methods return 405. This bridge has no mutation or privileged host-action API.

## Health-service reliability

An empty dependency configuration is alive but not ready: `/v1/status` returns 503 with `ready: false` and `reason: dependencies_not_configured`. Optional dependency outages report degraded health with HTTP 200; critical outages return 503.

Concurrent status callers share one in-flight observation, with the same `checked_at` timestamp. A later call starts a fresh observation; completed observations are not cached. The bridge admits at most 32 pending status requests and 64 TCP connections. Excess status callers receive 503 with `error: status_busy`, while `/healthz` does not wait for dependency probes. Headers and request receipt have 5-second and 10-second timeouts, respectively.

Probes connect directly to loopback without environment proxies and never follow redirects. They observe HTTP status only, discard response bodies, and apply the configured dependency deadline. A 2xx response is an endpoint-health observation, not verification of a business outcome. Malformed request targets and GET requests containing bodies receive 400; absolute/proxy-style request targets are refused.

Set `TITAN_SERVER_NODE_BIND` to `127.0.0.1`, `::1` or `[::1]`; both IPv6 spellings bind to `::1`. Public bind addresses fail at startup. SIGTERM/SIGINT stops accepting connections and drains bounded active probes before exit.

## Build the current package

Run `node scripts/package-directadmin-plugin.mjs apps/directadmin/server-node dist/directadmin`. It writes `dist/directadmin/titan-server-node.tar.gz` and prints a SHA-256 checksum. The archive has `plugin.conf` at its root, a fixed allowlist of runtime/lifecycle files, normalized timestamps and ownership, and executable modes for lifecycle scripts. Source symlinks, invalid plugin IDs/versions and missing package files fail closed.

Run packaging tests with `node --test scripts/package-directadmin-plugin.test.mjs` and health tests with `node --test apps/directadmin/server-node/runtime.test.mjs`.

The packager validates the existing Server Node package only; portfolio-wide role routes, lifecycle implementation, signed release provenance, service supervision and live DirectAdmin certification remain owned by #1154, #1155, #1049 and #812.

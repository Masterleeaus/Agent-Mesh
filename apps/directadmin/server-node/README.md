# Titan Server Node DirectAdmin surface

This plugin package currently includes a bounded, read-only health bridge in `runtime.mjs`. It binds to loopback only and checks the native Titan web health endpoint and the canonical Workforce `/ready` endpoint. It reports liveness separately from dependency readiness and never exposes dependency URLs or raw exception messages.

Run the local bridge with `node apps/directadmin/server-node/runtime.mjs`. Defaults are `127.0.0.1:3099`, web `127.0.0.1:3000/api/health`, and Workforce `127.0.0.1:3010/ready`. Ports may be configured with `TITAN_SERVER_NODE_PORT`, `APP_PORT`, and `WORKFORCE_PORT`. Optional `TITAN_SERVER_NODE_DEPENDENCIES` must be JSON containing loopback HTTP health targets only, with a maximum of 16 dependencies per status request.

- `GET /healthz` reports process liveness.
- `GET /v1/status` probes configured dependencies and reports readiness.
- Other paths return 404; non-GET methods return 405. This bridge has no mutation or privileged host-action API.

## Build the current package

Run `node scripts/package-directadmin-plugin.mjs apps/directadmin/server-node dist/directadmin`. It writes `dist/directadmin/titan-server-node.tar.gz` and prints a SHA-256 checksum. The archive has `plugin.conf` at its root, a fixed allowlist of runtime/lifecycle files, normalized timestamps and ownership, and executable modes for lifecycle scripts. Source symlinks, invalid plugin IDs/versions and missing package files fail closed.

Run packaging tests with `node --test scripts/package-directadmin-plugin.test.mjs` and health tests with `node --test apps/directadmin/server-node/runtime.test.mjs`.

The packager validates the existing Server Node package only; portfolio-wide role routes, lifecycle implementation, signed release provenance, service supervision and live DirectAdmin certification remain owned by #1154, #1155, #1049 and #812.

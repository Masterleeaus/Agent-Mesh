# Titan Server Node DirectAdmin surface

This plugin package currently includes a bounded, read-only health bridge in `runtime.mjs`. It binds to loopback only and checks the native Titan web health endpoint and the canonical Workforce `/ready` endpoint. It reports liveness separately from dependency readiness and never exposes dependency URLs or raw exception messages.

Run the local bridge with `node apps/directadmin/server-node/runtime.mjs`. Defaults are `127.0.0.1:3099`, web `127.0.0.1:3000/api/health`, and Workforce `127.0.0.1:3010/ready`. Ports may be configured with `TITAN_SERVER_NODE_PORT`, `APP_PORT`, and `WORKFORCE_PORT`. Optional `TITAN_SERVER_NODE_DEPENDENCIES` must be JSON containing loopback HTTP health targets only, with a maximum of 16 dependencies per status request.

- `GET /healthz` reports process liveness.
- `GET /v1/status` probes configured dependencies and reports readiness.
- Other paths return 404; non-GET methods return 405. This bridge has no mutation or privileged host-action API.

Run tests with `node --test apps/directadmin/server-node/runtime.test.mjs`. Host lifecycle, governed actions, evidence integration, service supervision, packaging/release and live DirectAdmin certification remain owned by #812 and its linked missions.
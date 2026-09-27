# Operations

## Runtime state

`RuntimeOperationalState` exposes rollout stage, kill switch and maintenance state. User/runtime routes accept traffic only when the runtime is operationally ready. Presentation availability never increases business authority.

## Health endpoints

- `/dashboard/admin/titan-interface-runtime/live` — process/component liveness.
- `/dashboard/admin/titan-interface-runtime/ready` — readiness to accept interface traffic.
- `/dashboard/admin/titan-interface-runtime/health` — aggregate diagnostics and registry/dependency health.

Liveness is intentionally independent of readiness: maintenance, draining, kill switch or disabled rollout can make readiness false while the component remains alive.

## Rollout states

Rollout: `DISABLED`, `INTERNAL`, `CANARY`, `TENANT_COHORT`, `GENERAL`.  
Maintenance: `ACTIVE`, `DEGRADED`, `MAINTENANCE`, `DRAINING`, `DISABLED`, `UNINSTALLING`.

## Host certification

Static/offline gates cover package, manifest, integrity and MySQL migration compatibility. Live host stages—provider boot, rendered navigation, role matrix, tenant isolation, queue/scheduler runtime, upgrade and uninstall—must be recorded only after execution on the actual deployed host.

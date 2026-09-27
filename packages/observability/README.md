# titan-observability

Owned P2-009 runtime for company-scoped diagnostics and observability.

- `contracts.mjs` — `titan.observability.v1` normalization and company-boundary enforcement.
- `runtime.mjs` — persistence, collector registry, snapshots and recent-event queries.
- `background.mjs` — service-worker collectors and `TITAN_OBSERVABILITY` message surface.
- `health-registry.mjs` — Pass 2 runtime-health probe registry with criticality, bounded timeouts, health normalization, failure streaks and recovery timestamps.

The runtime is authority-neutral by contract. It observes state; it does not authorize or mutate protected business operations.


## TZ-WP-002 Pass 2

Runtime-health probes are additive and authority-neutral. Critical probe failures can raise health severity but cannot grant, expand or mutate execution authority. Pass 2 intentionally does not add a new UI projection; that remains scheduled for packet Pass 8.

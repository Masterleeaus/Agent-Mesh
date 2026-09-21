# TZ-NEXT-015 Pass 9 — Onboarding Regression Scenarios

Pass 9 certifies scenario behaviour without adding a second onboarding runtime.

Scenarios covered:
1. first run — new company state is isolated, non-authoritative and not ready;
2. resume — persisted progress survives store reconstruction and revision protection remains active;
3. partial setup — readiness identifies only the remaining required configuration;
4. invalid import — validation fails closed and no staging record is written;
5. company switch — journey and import staging remain isolated by `company_id`;
6. restart — journey and staged imports reconstruct from persistence without gaining authority or execution.

The scenario suite intentionally uses the Pass 2, Pass 7 and Pass 8 public APIs. No production mutations, worker activation, messaging, payments, live import application or authority grants are introduced by this pass.

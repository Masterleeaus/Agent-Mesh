# Titan Mobile completion matrix

This is the live acceptance index for #1158. It is intentionally non-closing: the parent mission is complete only after each child owner supplies executed implementation, integration, and device evidence.

| Surface / requirement | Canonical owner | Current evidence | Remaining closure evidence |
| --- | --- | --- | --- |
| Shared Flutter shell and `zero` / `go` / `hub` identity | #542, #1160 | `apps/mobile/README.md`, `TitanSession.canonicalSurfaces`; bootstrap now shows a recoverable fail-closed error when required release configuration is missing | Fresh Flutter analyze, tests, mode-switch and stale-context tests; local widget test added but Flutter is unavailable in this environment |
| Hosted conversation, streaming, continuity, reconnect | #1159 / #1182 | `SurfaceSdkTitanGateway` requires an injected conversation transport; production composition must remain fail-closed when absent | Hosted endpoint contract, release-composition/widget test, reconnect/resume evidence, deployed run |
| DirectAdmin-hosted Workforce and Business Node boundary | #1169 | Boundary and ownership are documented by the claimed #1169 work | Authenticated cross-surface identity, company isolation, revision/idempotency and live endpoint evidence |
| Zero owner/manager workflows | #1170, #1046, #1056 | Active shell and generated-card/action surfaces exist | Hosted approval/outcome/evidence scenario; unauthorized, stale, error and accessibility states |
| Go assigned field workflow and offline evidence | #1170, #1045, #183 | Capture, job, schedule and offline command contracts are present | Assigned-scope scenario, encrypted staging/reconnect reconciliation, device evidence |
| Hub customer-safe requests and payment intent | #1170, #1053, #1054 | Customer and commercial screens exist as projections | Customer-scoped hosted scenario; no local success, cross-company read, or direct mutation |
| Android/iOS capability wiring and signed artifacts | #1162 / #1163 | Platform metadata and release work are tracked separately | Reproducible signed builds, update/rollback artifacts and protected signing verification |
| Physical-device certification and legacy retirement | #1164 | `lib/legacy` is donor-only per the mobile README | Android/iOS device matrix, low-connectivity/security/accessibility/performance evidence and reachability proof |

## Closure rule

Do not close #1158 because this matrix exists or because one child lands. Link each row to executed evidence, keep the parent open while any child, hosted endpoint, signed artifact, or device result is missing, and use `Refs #1158` for partial work.

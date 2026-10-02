# Maps Intelligence runtime donor disposition

Issue #1205 adds a provider-neutral Maps Intelligence contract under `packages/titan-platform`. The runtime is intentionally additive: it emits observations, signals, and governed proposals; it does not become the scheduling, identity, finance, credentials, or evidence authority.

## Donors and disposition

| Donor area | Disposition | Result |
| --- | --- | --- |
| Existing Titan platform contract/index conventions | Reused | The runtime is exported from `packages/titan-platform/src/index.ts` and included in the package TypeScript build. |
| Native route-estimation semantics | Adapted | A bounded Haversine estimate is implemented as an explicit `native-estimate` fallback. It is never presented as provider-grade route proof. |
| Provider geocoding, places, road-route, traffic, spatial, and weather integrations | Deferred behind typed ports | `MapsProviderPorts` defines the integration boundary. Credentials, health, and webhooks remain owned by #1060/#403; no provider SDK or network dependency is introduced. |
| Territory, branch, postcode/suburb, travel-zone and polygon concepts | Adapted | `resolveTerritory` provides company-isolated, priority-ordered decisions with inclusion/exclusion handling and proposal-only configuration authority. |
| Location/geofence handling | Adapted | `evaluateGeofence` applies purpose, consent, accuracy and retention rules and explicitly refuses durable raw-location evidence. |
| Dispatch/routing score concepts | Adapted | `scoreDispatchCandidate` evaluates hard eligibility before soft route signals; #353 remains assignment authority. |
| Pricing distance/time signals | Adapted | `createPricingSignals` emits neutral observations for #1054; Finance remains final-price authority. |
| Route receipts and visit evidence | Deferred/adapted | Provider/native receipts are observation references. #913 remains the evidence ledger and map responses never prove a visit occurred. |
| Accepted-assignment reconciliation | Adapted | Provider refreshes create a proposal and do not silently rewrite accepted assignment state. |
| Donor test scenarios | Adapted | Focused native tests cover fallback, alternatives, stale data, territory conflicts/isolation, geofence consent/precision/retention, hard eligibility, outage uncertainty, replay conflict, and provider failure. |
| Live provider and deployed-host tests | Deferred/rejected for this issue | No network credentials or map host is required; native-only behavior is deterministic and covered in trusted CI. |

## Verification matrix

The focused suite and TypeScript build exercise the native-only path, provider alternatives and failure fallback, territory boundary/configuration decisions, consent and precision uncertainty, hard eligibility ordering, pricing neutrality, outage uncertainty, replay/cross-company protection, and explicit freshness state. Time values are ISO timestamps, preserving timezone/DST semantics without introducing a second time authority.

## Non-goals

This runtime does not schedule or assign work, establish worker identity or qualifications, set prices, manage provider credentials/webhooks, or persist raw location as business evidence. Those authorities remain with the existing Titan contracts named above.

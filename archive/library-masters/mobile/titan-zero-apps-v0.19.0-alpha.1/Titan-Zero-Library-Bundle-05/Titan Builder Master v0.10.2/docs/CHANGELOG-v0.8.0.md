# Titan Builder v0.8.0

- Hardened packaging for the current Titan installer: `titan-extension-v1` root manifest, flat ZIP root, exact provider identity, extension-specific `titan-builder` publish tag, and generated integrity map.

## CRM + TitanAI + Four-PWA Provisioning + Titan Onboarding

- Removed active WorkCore architecture and replaced business read-model/action contracts with CRM/capability contracts.
- Added read-only CRM data-source provider and CRM vertical-context bridge.
- Added fail-closed standalone TitanAI adapter with governed proposal validation.
- Added Titan Hub, Titan Go, Titan Command and Titan Onboarding surface identities/connectivity contracts.
- Added Onboarding surface/template/default page/spec.
- Added company-scoped `ApplicationProvisioningGateway`, readiness service, mobile application-definition publisher, actor authorization and audit logging.
- Added four-app idempotent provisioning/handoff and shared-brand support.
- Added deterministic v0.7 legacy migration normaliser with explicit review markers for ambiguous legacy actions.
- Preserved v0.7 Premium Application Patterns, 125 registered components, 26 blocks, existing 10 templates, 29 pages and 25 specs; new four-PWA resources are additive.

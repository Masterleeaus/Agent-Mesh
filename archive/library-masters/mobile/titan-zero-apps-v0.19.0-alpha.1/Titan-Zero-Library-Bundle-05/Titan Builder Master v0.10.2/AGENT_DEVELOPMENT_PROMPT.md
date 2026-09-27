# TITAN BUILDER v0.9.0 — CRM + TITANAI + FOUR-PWA + MANAGEMENT UI

## Mission

Maintain Titan Builder as Titan Zero's schema-driven, presentation-only application configuration engine. This v0.9.0 branch preserves the v0.8.0 CRM/TitanAI/four-PWA cutover and is based on Titan Builder v0.7.0 Premium Application Patterns and preserves its Generative UI, Premium/Mobilekit presentation layer, company-scoped persistence, versioned publishing, immutable snapshots, rollback, assets, templates, vertical packs and preview system.

## Locked architecture

```text
Titan Onboarding -> TitanAI -> Interaction Engine -> Capability Router
                                      |
                     +----------------+----------------+
                     |                |                |
                    CRM         Titan Builder     Titan Connect
             business state      app specs         channels
                                      |
                               Titan Mobile Core
                         +------------+------------+
                         |            |            |
                      Titan Hub    Titan Go   Titan Command
```

Titan Builder builds, validates, versions, previews and publishes application definitions. Titan Mobile runs the applications. Titan Onboarding conversationally provisions them. Interaction Engine owns wizard progression. TitanAI owns reasoning. CRM owns operational business state. Chatbot Builder remains a separate product-specific builder. Titan Connect owns communications transport.

## Non-negotiable rules

- `company_id` is the only persisted tenant boundary. Trusted middleware company context and authenticated-user company context must match; absence or conflict fails closed.
- There is no active legacy predecessor business-system target architecture. CRM is the authoritative business-data provider through read-only contracts/capabilities; never import CRM Eloquent models.
- Builder is presentation-only. Business mutations are external allowlisted intents dispatched through governed platform capability layers.
- TitanAI is accessed only through `TitanAiRuntimeGateway` / `TitanAIAiUiGenerator`. Keep `UnavailableAiUiGenerator` as the fail-closed fallback. Never embed provider-specific model orchestration.
- AI output is a proposal only. Normalise, validate, check component/action/data-source availability, preview and approve before save/publish. Never permit arbitrary executable HTML/JS/PHP.
- Canonical surfaces are `customer`, `field`, `owner`, `onboarding`, displayed as Titan Hub, Titan Go, Titan Command and Titan Onboarding. Preserve the first three persisted IDs.
- Provision company-specific application definitions; do not fork or generate PWA source code per company.
- Titan Mobile owns offline databases, service workers, sync, device identity and runtime execution. Builder only declares presentation/offline/readiness metadata.
- Chatbot Builder remains independent. Builder may hold an opaque chatbot reference and presentation hints only.
- Titan Connect owns credentials, OAuth, providers, webhooks and message delivery.
- The ten Field & Home Services verticals are presentation/configuration packs. CRM capabilities and company configuration determine actual enabled business behavior.

## Four-PWA provisioning

Use `ApplicationProvisioningGateway` as the stable Builder-facing provisioning boundary. Provisioning must reuse Builder projects/pages/version/snapshot persistence and expose validated mobile definitions through `MobileApplicationDefinitionPublisher`. Keep provisioning idempotent per company + surface.

The four product identities are:

- `customer` -> Titan Hub (online-first)
- `field` -> Titan Go (offline-first)
- `owner` -> Titan Command (online-first with read-only cached snapshot)
- `onboarding` -> Titan Onboarding (online-first setup/provisioning experience)

## CRM contracts

Use `DataSourceCatalog`, `DataSourceDefinition`, `DataSourceProvider` and `CrmBuilderDataSourceProvider`. Specs reference catalogued read models such as `crm.customer.*`, `crm.field.*`, `crm.owner.*` and `crm.business.*`; they never contain user-controlled endpoint URLs or CRM model classes.

## Capability and authorization model

Capability discovery must fail closed. Source surface is audit context, not authority. Every governed operation requires resolved company context plus actor capability. Relevant Builder capabilities include `builder.read`, `builder.edit`, `builder.publish`, `builder.application.*`, `builder.brand.*`, `builder.navigation.*`, `builder.theme.*`, `builder.features.*`, `builder.page.*`, `builder.vertical.apply`, `builder.preview`, `builder.validate`, `builder.readiness` and `builder.rollback`.

## Validation and release discipline

Before release, run PHP lint, JSON parsing, JavaScript syntax/runtime tests, standalone Builder tests, integration verifier, Blueprint v3.1 manifest/filesystem/security checks, merge-marker scan, company-boundary scan, legacy predecessor reference classification and unsafe-execution scan. Host certification must be explicitly marked UNVERIFIED unless the actual MagicAI/Titan Zero Laravel host is available and `artisan` migration/routes/tests plus service-container resolution are executed there.


## v0.9 Management UI boundary

Preserve the extension-owned company management routes under `/titan-builder` and Super Admin routes under `/titan-builder/admin`. Company management uses trusted `company_id`; Super Admin requires `builder.admin`. Do not replace host authorization or copy MagicAI core views.

# Titan Builder Migration Map

## Retained from the v0.7 active Builder

- schema-driven `BuilderRegistry`, Generative UI normaliser/validator/renderer and catalogues;
- 125 registered components, 26 blocks, 10 original templates, 29 original pages and 25 original specs;
- Premium Mobilekit application-pattern resources and scoped presentation assets;
- `company_id` scoped persistence, guarded assets, preview, versioning, immutable publishing and rollback;
- Customer/Field/Owner persisted surface IDs and ten Field/Home Services vertical-pack slugs.

## v0.8 cutover additions

- `CrmBuilderDataSourceProvider`, CRM read-model definitions and `CrmBusinessConfigurationGateway`;
- `TitanAIAiUiGenerator` plus fail-closed `UnavailableAiUiGenerator` fallback;
- `CapabilityDiscovery` and capability-aware action/read-model advertisement;
- `ApplicationProvisioningGateway`, readiness service and `TitanApplicationDefinition` transport DTO;
- Titan Mobile application-definition publisher;
- Titan Onboarding surface/template/default page/spec;
- product identities Titan Hub, Titan Go, Titan Command and Titan Onboarding;
- actor capability authorization and structured Builder audit logging;
- deterministic legacy business-spec migration normaliser with explicit manual-review markers.

## Compatibility-only code

`LegacyBusinessSpecMigrator` recognizes retired v0.7 business action/read-model tokens so existing projects can be normalized safely. It is not an operational dependency. Ambiguous property/inventory actions are removed and marked for migration review instead of being guessed.

`ChatbotBuilderImportAdapter` remains an explicit caller-invoked compatibility transformer. Chatbot donor models/routes/views remain under `donor/chatbot-coupled/` and are never auto-loaded.

## Removed from active architecture

Active Builder runtime/resources no longer depend on the retired business operating layer. CRM capability/read-model contracts are authoritative for current business data integration. Builder still does not embed CRM models, TitanAI, Interaction Engine, Chatbot Builder, Titan Connect or Titan Mobile runtime code.

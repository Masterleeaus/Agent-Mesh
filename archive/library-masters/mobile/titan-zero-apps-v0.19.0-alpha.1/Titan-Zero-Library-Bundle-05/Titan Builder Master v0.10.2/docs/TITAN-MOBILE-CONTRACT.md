# Titan Mobile Application Definition Contract

`MobileApplicationDefinitionPublisher` produces `titan-mobile-application-definition/1` JSON. Titan Mobile consumes the DTO and never imports Builder Eloquent models.

The contract contains company/project identity, surface/product, vertical, identity/brand/navigation, page specs, enabled features, assistant presentation, available and unavailable read-model/action intents, offline policy, notifications, privacy/settings, version/snapshot metadata and activation state. Credentials are forbidden.

Draft preview uses current company-scoped page specs. Published output uses the active immutable publish snapshot, including the application metadata captured inside that snapshot. This means rollback restores the prior application configuration and page state together.

Capabilities are filtered at publication time. Unknown or unavailable actions/data sources are returned as unavailable with structured reasons rather than advertised as working.

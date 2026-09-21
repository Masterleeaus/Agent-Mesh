# Codee Universal AI Provider Contract

Every Onboard AI adapter must satisfy `CodeeAIProviderContract` and expose these operations:

`connect`, `disconnect`, `health`, `listModels`, `getModel`, `getCapabilities`, `complete`, `stream`, `embed`, `countTokens`, `estimateCost`, `getQuota`, `getRateLimits`, `supportsTools`, `supportsStructuredOutput`, `supportsVision`, `supportsReasoning`, `supportsEmbeddings`, `supportsLongContext`, `supportsCaching`, `supportsBatch`, and `supportsFiles`.

Adapters register through `CodeeProviderGateway.registerProvider()` / `CodeeAIProviderRegistry.register()` and never register an inference path directly with Managers, Repository Intelligence, Titan Intelligence, Browser Intelligence or Diagnostics.

## Provider lifecycle

The foundation recognizes lifecycle/status classes needed by the complete requirements, including `ACTIVE`, `DEGRADED`, `DEPRECATED`, `RETIRED`, `TEMPORARILY_UNAVAILABLE`, `CONFIGURATION_REQUIRED`, `PAID_ONLY`, `FREE_LIMITED`, `FREE`, `LOCAL`, `FREE_DEVELOPMENT`, `FREE_CREDIT_LIMITED`, `FREE_TRIAL`, `BYO_PAID_OR_PROMOTIONAL`, and `PAID`.

These labels are runtime metadata, not permanent assumptions. Provider implementation passes must discover current models, pricing, quotas and capabilities from provider APIs/official metadata where available.

## Model records

`CodeeAIModelRegistry` stores provider/model identity plus lifecycle, free/paid classification, pricing, context/output limits, capabilities, rate limits, privacy metadata, last capability probe, health and reliability score. Provider and model are deliberately independent entities.

## Authority

An adapter may return text, structured results and proposed tool calls. It may never return executable authority. `CodeeAIResponseContract` always resets plan/mutation/browser/artifact/backup/spend/memory authority fields to false.

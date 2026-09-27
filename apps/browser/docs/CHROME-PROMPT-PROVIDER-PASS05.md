# Pass 05 — Chrome built-in Prompt API provider

Titan Code exposes Chrome built-in AI as the governed inference provider `chrome-prompt-api` when the Prompt API is available in the current extension execution context.

- Locality: `ON_DEVICE`
- Cost class: `DEVICE_OWNED`
- Execution authority: none
- Canonical/verification/plan authority: none
- Gateway authority remains `CodeeProviderGateway`
- The adapter is registered only after runtime availability succeeds.
- The provider is private Titan Code development infrastructure. Titan Zero production does not depend on it.

The adapter intentionally advertises only capabilities that this integration can verify. It does not claim tools, embeddings, files, vision, batch, caching, or structured-output support.

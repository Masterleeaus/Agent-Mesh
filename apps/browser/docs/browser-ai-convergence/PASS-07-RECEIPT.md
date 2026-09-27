# Pass 07 — AI Router & Capability Selection

**PRIVATE TITAN CODE DEVELOPMENT ONLY**  
**NOT FOR TITAN ZERO PRODUCTION USE**  
**NOT A TITAN ZERO RUNTIME DEPENDENCY**

Implemented `CodeeAIRouter` as a selection layer over the existing Intelligence Catalogue, Model Registry and `CodeeProviderGateway`.

Routing considers required capabilities, execution locality, privacy/local-only policy, cost mode, provider lifecycle, model health/reliability, forbidden providers and explicit preferences. The router never executes providers directly: `CodeeProviderGateway` remains the sole inference execution authority.

Default locality preference is device-first: ON_DEVICE → LOCAL_DEVICE → CUSTOMER_HOSTED → SUBSCRIPTION → BYO_API → TITAN_MANAGED. `company_id` remains the sole tenant boundary.

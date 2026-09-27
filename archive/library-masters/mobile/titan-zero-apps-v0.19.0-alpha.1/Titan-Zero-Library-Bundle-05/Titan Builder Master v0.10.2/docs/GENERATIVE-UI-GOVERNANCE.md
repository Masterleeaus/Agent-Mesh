# Generative UI Governance

Titan Builder renders registry-backed declarative UI only. Components, actions and data sources are allow-listed. The validator rejects unknown component types, unknown actions, unknown data sources, unsafe JSON pointers, executable URL schemes, raw HTML/script props and oversized/deep specifications.

Builder remains presentation-only. External intents describe desired operations but are not executed by Builder's model layer. Capability discovery determines which external actions and read models may be advertised for a company.

TitanAI proposals pass through the same normaliser and validator as human-authored specs. Preview may use explicit fixtures or authorized company read DTOs; preview does not bypass CRM authorization and never performs live business mutations.

The renderer contains legacy uses of `innerHTML = ''` solely to clear owned DOM containers. No user-supplied HTML string is assigned through those paths; raw HTML props remain prohibited by the server validator.

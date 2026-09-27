# Memory Map

## Types

- working — transient active conversation/work state; durable persistence should be exceptional
- episodic — what happened
- semantic — useful believed facts
- procedural — how work is successfully performed
- preference — stable/semi-stable preferences
- business — longitudinal organisational patterns/lessons/context

## Scopes

personal, agent, team, company, customer, site, service, task, conversation.

Retrieval requires `company_id` first, then explicit scope/entity filters, expiry/supersession filtering, relevance, confidence and recency. Private agent scope is not globally shared.

## Business-state boundary

Structured operational truth (booking time, invoice balance, phone, availability, etc.) remains in domain systems. Memory can describe tendencies/history but cannot silently mutate canonical state.

## Lifecycle

candidate input -> write policy/confidence ceiling -> typed/scoped durable memory -> bounded retrieval -> supersession/expiry/deletion. Consolidation should create a new derived candidate with provenance while retaining audit evidence rather than destroying source evidence.

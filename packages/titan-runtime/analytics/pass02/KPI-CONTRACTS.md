# KPI Registry and Value Contract — Pass 2

This pass defines a derived analytics contract, not a competing operational database.

The registry covers seven domains: revenue, jobs, workforce, quality, customer, cash, and operational health. Every metric points to source IDs inventoried in Pass 1. Source modules retain ownership of their business state.

A KPI result must identify `company_id`, an explicit time window/timezone, status, and provenance. Missing inputs are represented as `status: missing`, `value: null`, and a reason. The contract prohibits synthetic fallback numbers.

Pass 3 will implement deterministic aggregation against these definitions.

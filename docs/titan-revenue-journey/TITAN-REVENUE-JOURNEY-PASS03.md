# Titan Revenue Journey — Pass 03

Pass 03 adds a quote lifecycle evidence projection over the retained canonical quote lifecycle implementation.

It represents journey-facing states `draft`, `sent`, `viewed`, `accepted`, `declined`, `expired`, and `superseded` without creating another quote source of truth. `sent` maps to canonical `issued`; `viewed` is an observation-only projection over an unchanged `issued` quote; `declined` maps to canonical `rejected`; and `superseded` is accepted only when canonical cancellation evidence explicitly carries reason `superseded`.

Titan CRM remains quote authority. The projection cannot create or mutate quote records, grant authority, or treat quote acceptance as booking completion.

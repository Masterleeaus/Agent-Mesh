# KPI Aggregation Runtime — Pass 3

The runtime deterministically filters observations by canonical `company_id` and an explicit half-open time window `[start, end)`. It rejects legacy tenant aliases at every public aggregation boundary, cross-company observations, out-of-window observations, and duplicate events keyed by `company_id + source_id + event_id`.

Supported aggregation primitives are count, distinct count, sum, average, ratio, and age/freshness. Unsupported or incomplete data fails closed into the KPI missing-data contract rather than inventing a number.

All output provenance is derived from accepted source observations. Analytics remains read-only and authority-neutral.

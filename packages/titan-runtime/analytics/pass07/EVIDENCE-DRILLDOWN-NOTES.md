# KPI evidence drill-down — Pass 7

Drill-down descriptors are derived only from KPI provenance entries that include both `source_id` and `source_ref`. Older summary-only provenance remains valid and simply produces no link.

Analytics does not invent URLs or assume source UI routes. Each link exposes an opaque `source_ref` for the owning source module to resolve. Links are deduplicated and sorted deterministically, remain company-scoped, read-only and authority-neutral.

# KPI Trend + Variance — Pass 5

Comparisons are derived from already-produced KPI values. The trend layer never reaches into source modules to guess missing observations.

Rules:
- both compared KPI values must share `company_id` and `metric_id`;
- `missing`/`invalid` inputs yield a missing comparison;
- `partial` input propagates `partial`;
- percent change/variance is left `null` when the previous/target value is zero;
- provenance from the compared metric values is retained;
- no source or execution authority is granted.

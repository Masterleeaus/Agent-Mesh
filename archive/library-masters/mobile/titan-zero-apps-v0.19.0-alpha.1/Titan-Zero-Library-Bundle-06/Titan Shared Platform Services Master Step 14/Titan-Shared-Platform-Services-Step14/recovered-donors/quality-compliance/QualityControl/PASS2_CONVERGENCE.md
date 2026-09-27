# Pass 2 — Canonical Quality Convergence

## Runtime ownership

`QualityControl` is the sole active owner of inspection scheduling, recurring schedules, templates, QC records, scoring, corrective actions, follow-up verification, re-clean transitions, quality reporting and quality UI.

`CleanQuality` and `Inspection` are disabled donor descriptors. Their provider arrays are empty and their runtime marker files document that they must not register routes, migrations, events, commands or jobs.

## Preserved concepts

- CleanQuality Filament resources were redesigned around canonical `inspection_schedules` and `qc_records`; the donor `inspections` table is not restored.
- CleanQuality action concepts were retained as `CompleteInspection`, `ScoreQualityCheck`, and `AuthoriseReclean` in the QualityControl namespace.
- Quality report generation is now an explicit-company service suitable for authenticated UI, queue and Workforce execution.
- Existing Inspection scheduling/templates remain in QualityControl, which already contained the stronger planning implementation.
- CleanQuality URLs are preserved via named redirect bridges in QualityControl rather than loading a second route provider.

## Tenancy

All new background/reporting APIs require an explicit positive `company_id`. No new `tenant_company_id` key and no user-id-as-company fallback are permitted.

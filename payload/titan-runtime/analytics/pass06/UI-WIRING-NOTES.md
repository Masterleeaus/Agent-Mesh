# Analytics UI contribution wiring — Pass 6

Titan already exposes `titan-capabilities/contributions/` as the additive discovery seam for presentation, projection and other contribution types. This pass integrates through that seam rather than editing existing pages, routers or navigation files.

Two company-scoped, authority-neutral contributions are exposed:
- a read-only KPI projection for dashboard / Daily Operations discovery;
- a presentation-only KPI card-grid descriptor.

The surface model carries KPI status, value, trend/variance summaries and provenance counts. Missing KPI data is represented by the existing analytics status rather than substituted with display-time estimates.

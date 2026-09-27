# Donor Rationalization — v1.0

Pass 20 audited the supplied Menu, Focus Mode, Announcement, Onboarding Pro and Introductions packages by exact ZIP hash. Interface Runtime absorbs **presentation primitives only**. It does not copy donor persistence, business rules, wizard state, survey state or announcement records.

## Final decisions

| Donor | What is useful | v1.0 decision |
|---|---|---|
| Menu | hierarchy, labels/icons, ordering, enabled-state preservation, host menu regeneration | Interface Runtime owns registry-derived navigation projection and self-heals its own host menu entry. Keep the host Menu admin editor if operators still need manual customization of the wider application menu. |
| Focus Mode | the supplied package is actually an AI-tools dropdown over `MenuService`; it has no real focus-state engine | Replace its quick-tool role with Command Surface/navigation. Interface Runtime provides a real presentation-only focus policy that reduces nonessential chrome but **never hides approvals, sync/conflict state, attention HUD or an escape control**. |
| Announcement | announcement records/types and a dashboard card | Keep announcement authoring/data outside Interface Runtime. Present urgent items through the Global Work `attention` tray and `AttentionHudProjector`. Do not migrate the announcements table into Interface Runtime. |
| Onboarding Pro | coachmarks/tours, banners, surveys, introduction styling/content | Split responsibilities. Semantic coachmark presentation moves to Interface Runtime; any real setup wizard/journey remains Interaction Engine. Banners/surveys/content records remain source-owned until separately migrated or retired. |
| Introductions | introJs coachmark tour and `tour_seen` completion marker | Retire after guidance cutover. It duplicates tour presentation and has no unique domain authority that belongs in Interface Runtime. |

## Guidance safety changes

The old tour views interpolate rich HTML and CSS selectors into browser libraries. v1.0 intentionally does **not** carry that model forward. Guidance uses bounded semantic fields only: `key`, plain-text `title`, plain-text `description`, semantic `target_ref`, safe placement and optional registered `action_ref`. Raw HTML, arbitrary selectors, arbitrary executable JavaScript and direct mutations are rejected. A guidance action is always emitted with `executable=false`.

## No duplicate workflow authority

Interface Runtime never owns wizard branching, validation, journey/session persistence, completion rules or workflow transitions. Titan Interaction Engine remains the wizard/journey authority. Onboarding and coachmarks are presentation projections only.

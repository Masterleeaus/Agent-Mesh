# Titan Interface Runtime v1.0 Migration Guide

## Recommended cutover order

1. Install the Website1408 transition build on the current host, or the canonical flat-root build once the host validator accepts the strict Step-10 root schema.
2. Confirm `/dashboard/admin/titan-interface-runtime/live` and `/ready`, then open the user Interface Runtime menu entry.
3. Confirm Command, Go, Hub and Onboarding surface policies before disabling any donor UI package.
4. Keep the host Menu admin editor if manual application-wide menu editing is still required. Interface Runtime replaces **navigation projection**, not the host's general menu-administration product.
5. Disable Focus Mode after the Command Surface/Interface navigation provides the required quick access. The supplied donor stores no authoritative data.
6. Keep Announcement enabled until its authoritative announcement feed is exposed through a Global Work `attention` provider or moved to another source extension. Do not delete announcement records as part of Interface Runtime rollout.
7. For Onboarding Pro, move tour/coachmark rendering to semantic guidance and route setup journeys to Titan Interaction Engine. Keep banners/surveys only if still required by the product.
8. Disable Introductions after equivalent semantic guidance is verified. Its legacy `tour_seen` marker may remain host-owned during transition; Interface Runtime does not claim that record.
9. Verify CRM → Work → Finance → Connect → Maps navigation/object surfaces under Command, then repeat the customer-safe Hub matrix and worker Go matrix.
10. Only then uninstall donor packages that have no remaining source-data/admin responsibility.

## Upgrade from v0.19.0

v1.0.0 is cumulative and migration-free. Replace v0.19.0 with the matching v1.0.0 installer package. Interface Runtime owns no business tables, so there is no domain-data migration. Existing domain contributions remain authoritative and are rediscovered on boot.

## Rollback

Rollback means reinstalling the previous verified cumulative package and re-enabling any donor presentation extension that was disabled during cutover. Because Interface Runtime does not migrate/delete donor or domain records, rollback does not require reconstructing CRM, Work, Finance, Connect, Maps, announcement, survey or wizard state.

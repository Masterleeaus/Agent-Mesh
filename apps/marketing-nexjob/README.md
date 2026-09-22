# ⚠️ ARCHIVED — do not use (2026-08-28)

**This repo was never deployed and its content is dangerously stale.**

- The **live** marketing site is built from
  [`nexjob/frontend`](https://github.com/sguilkey6-crypto/nexjob) (React SPA,
  prerendered to `frontend/dist/`, served by the `nexjob-ui` Render static
  service at https://nex-job.com). Fix marketing copy **there**, never here.
- The pricing in this repo is **wrong in every tier**: a free Solo plan, a
  $49 Crew with per-seat overage, a "Scale" tier, and a $15/user fee — none
  of which exist. Canonical prices live in
  `nexjob/app/services/stripe_billing_service.rb` (Solo $39 / Crew $69 /
  Ops $149 / Pro $249, plus the Roofing $219 and Electrical $179 trade
  plans), enforced on the public pages by
  `nexjob/frontend/scripts/claims-guard.mjs`.
- It also claims features under names and states that no longer match the
  product. Any copy resurrected from here would violate the marketing-copy
  verification hard rule in `nexjob/CLAUDE.md`.

Archived per the 2026-08-28 parity-audit program
(`~/Developer/briefs/BRIEF-2026-08-28-parity-audit-cowork.md`, §5) so no
future session or contributor mistakes this for the real site. If you need
anything from the old content, it remains readable in this archive's
history.

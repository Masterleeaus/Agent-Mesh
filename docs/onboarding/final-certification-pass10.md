# TZ-NEXT-015 Pass 10 — Final certification

Final certification is evidence-only: no production onboarding runtime is changed in Pass 10.

Certification gates:
- completed onboarding state persists across store reconstruction;
- required configuration projects as operationally ready;
- optional payments/import setup may remain explicitly skipped without granting authority;
- business/settings persistence remains covered by the Pass 3 authority suite;
- all onboarding views and completion state remain `company_id` scoped and non-authoritative;
- exact reconstruction is Manager Merge46 plus this cumulative lane delta;
- Manager must strip embedded `Agent Mesh/` coordination payload before production merge.

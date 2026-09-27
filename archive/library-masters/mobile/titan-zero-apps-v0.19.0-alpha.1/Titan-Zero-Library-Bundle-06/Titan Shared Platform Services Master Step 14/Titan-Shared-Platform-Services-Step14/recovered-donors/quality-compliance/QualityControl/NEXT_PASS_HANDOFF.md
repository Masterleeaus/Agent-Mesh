# Next Pass Handoff — Pass 3 Feedback & Complaint Convergence

Use this Pass 2 cumulative package as the only baseline.

Deep scan `CustomerFeedback`, `Complaint`, `feedback/Complaint`, `feedback/Feedback`, and `feedback/ReviewModule`. Make **CustomerFeedback** the canonical destination for complaints, general feedback, NPS, CSAT, channels, replies and customer-facing resolution state. Merge the strongest Titan-specific behavior from `Complaint`: QC/re-clean linkage, complaint lifecycle signals, escalation, corrective work creation, response-analysis/drafting concepts, and SLA behavior.

Requirements:

- Do not retain multiple executable complaint/feedback runtimes or duplicate route/table ownership.
- Replace any legacy `WorkRequest` coupling with the Titan Zero Assurance governed Work Item boundary.
- Preserve useful donor source in quarantined archives when removing runtime modules.
- All new/changed data access must use canonical `company_id`; background/AI execution must not depend on an interactive Auth session.
- Keep the QualityControl re-clean/complaint bridge working against the new canonical feedback destination.
- Fix the existing parse-broken `feedback/Feedback/Http/Controllers/ComplaintController.php` by quarantining or replacing that donor runtime rather than carrying the failure forward.
- Secure credential/config handling encountered in CustomerFeedback (including IMAP password storage/display) rather than propagating plaintext secret behavior.
- Re-scan after repair; run fresh PHP lint, JSON parsing, route/table ownership, donor namespace reference, tenancy and behavioral checks.
- Produce a freshly verified cumulative Pass 3 ZIP. Do not mark complete unless the exact final ZIP is re-extracted and verification passes from that extraction.

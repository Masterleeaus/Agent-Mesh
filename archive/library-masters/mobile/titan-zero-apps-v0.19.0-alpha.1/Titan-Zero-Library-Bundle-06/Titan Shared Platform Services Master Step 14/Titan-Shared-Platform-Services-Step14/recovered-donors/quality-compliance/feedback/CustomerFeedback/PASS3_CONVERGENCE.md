# Pass 3 — Feedback & Complaint Convergence

CustomerFeedback is the sole active feedback/resolution runtime. Complaint, the nested Complaint/Feedback donors, and ReviewModule are quarantined as non-executable descriptors with their exact Pass 2 source preserved under `LegacyDonors/`.

Canonical behavior now includes complaints, general feedback, external review ingestion, NPS/CSAT, replies, AI insights, QC/re-clean linkage, SLA/escalation/resolution tracking, encrypted IMAP secrets, and governed corrective Work Item requests through Titan Zero Assurance.

`complaint_id` remains as a compatibility field in QualityControl records/schedules, but it now references the canonical `feedback_tickets.id` where `feedback_type=complaint`.

# Titan Apps: Builder Integration Checklist

- [ ] Install as `titan-builder`; do not create a second canonical Chatbot Builder.
- [ ] Resolve app identities through Core (`zero`, `go`, `hub`) and treat legacy names as compatibility inputs only.
- [ ] Preserve onboarding as `surface: zero`, `journey: onboarding`.
- [ ] Keep provider contributions declarative and provenance-tagged.
- [ ] Reject arbitrary JavaScript, HTML, CSS, SQL, credentials, permissions or authority-bearing metadata.
- [ ] Validate visual metadata contract version and schema SHA-256 before handing to Visual Runtime.
- [ ] Preserve `company_id` as the sole company/tenant boundary; legacy tenant identifiers are compatibility inputs only and must resolve to `company_id`.
- [ ] Run publishing/rollback and Generative UI regression suites in the host.

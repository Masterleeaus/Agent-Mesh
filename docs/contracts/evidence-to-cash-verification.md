# Evidence-to-Cash verification contract

The revenue journey observation contract records provider state, provenance and evidence, but it does not grant authority or prove a financial outcome.

`verifyInvoicePaymentOutcome` is the boundary for a verified payment outcome:

1. The observation must be company-scoped and contain a settled payment whose paid amount covers the invoice total.
2. Titan must perform an authoritative reread; a provider acknowledgement or webhook by itself is rejected.
3. Verification evidence and a verification timestamp are required.
4. The resulting `VERIFIED` outcome is evidence for downstream Finance/Reality projections only. It grants no authority, does not execute money movement, and does not create or mutate entities.
5. Cross-company verification fails closed.

The outcome is idempotently derived from the observation key and keeps the original revenue journey, invoice and payment references.

# Visual field evidence intelligence donor disposition

Issue #1207 adapts the Titan AI Vision v1.12.6 donor as attributed observations and review proposals over existing #913 evidence references. The archive inspected was `Titan Zero Library Bundle 03/.../Titan AI Vision Master v1.12.6.zip`.

## Source and test scan

Inspected donor source:

- `System/Contracts/VisionProviderContract.php`: provider boundary for analysis.
- `System/Http/Requests/AnalyseVisionRequest.php`: authenticated validation for mode/profile/instruction, bounded image count, capture/pair keys, quality reports, and company/job/asset context.
- `System/Services/EvidenceQualityAnalyzerService.php`: decoded-image quality metrics, duplicate detection, policy result, and retake guidance.
- `System/Services/BeforeAfterPairingService.php`: capture-role/pair-key grouping and incomplete pair handling.
- `System/Services/VisionChangeDetectionService.php`: verified historical baseline requirement, explicit not-comparable outcomes, review routing, and evidence lineage.
- `System/Services/CompletionAssuranceV2Service.php`: missing-evidence, pending-variation, finding, and unsupported-scope blockers; no direct approval.
- `System/Services/AssetVisualPassportService.php`: pending identity/passport proposals and evidence requirements before verification.
- `System/Services/QuoteVariationIntelligenceService.php`: scope/material/service proposals and explicit prohibition on invented pricing.
- `System/Services/EvidenceContinuityPolicyService.php`: verified-baseline and integrity requirements.
- `System/Services/SafetyCompliancePolicyService.php`: high/critical and regulated-domain escalation; certifications remain false.

Inspected donor tests:

- `tests/Feature/EvidenceQualityCaptureGuidanceTest.php`: quality thresholds, duplicates, preflight guidance and persistence.
- `tests/Feature/BeforeAfterPairingTest.php`: pair grouping and identifiers.
- `tests/Feature/CompletionAssuranceV2Test.php`: blockers and router enforcement.
- `tests/Feature/MobileCaptureTest.php`: capture key, preview grid and checklist route.
- `tests/Security/GovernanceTest.php`: executor/assurance guard and prohibition on direct completion mutation.

The additional archive inventory included dedicated vertical-pack, quote variation, provider registry, prompt-builder, review-router and continuity suites. The listed donor source and focused test files were inspected directly; the repository’s entire unrelated archive test corpus was not executed.

## Reuse, adaptation and exclusions

| Donor behavior | Disposition in Titan Zero |
| --- | --- |
| Provider contract and analysis lineage | Adapted as bounded company/subject/revision/consent/purpose contracts and typed provider port for #1055. Only authorized media references are passed; raw bytes/secrets are absent from runtime prompts and logs. |
| Capture quality metrics and duplicate detection | Adapted as a versioned, provider-neutral threshold policy over authorized local quality metrics. Retake guidance is tied to the exact accepted evidence ref; image decoding and byte custody remain with the capture/#913 layer. |
| Capture checklists and offline capture | Adapted as versioned checklist inputs and offline guidance over existing evidence refs; original media provenance remains with #913. |
| Before/after comparison and change findings | Adapted as source-referenced proposals. Missing/changed source revisions, contradictory findings and uncertain results escalate; none establish a verified defect or completed task. |
| Historical baseline comparison | Deferred until #913 exposes a canonical verified-baseline read contract; no unverified donor baseline behavior is reproduced. |
| Asset passport and inspection profiles | Adapted as versioned pending proposals for #1057/#1065 review, not a second effective-policy registry. Identity remains unverified. |
| Completion assurance and quote variations | Adapted as governed review proposals; #14 and domain owners retain mutation authority. Pricing is never inferred by this runtime. |
| Safety/compliance policy | Adapted as explicit review escalation. Compliance sign-off, certification, face recognition and authority decisions are rejected. |
| Evidence storage/media vault and donor persistence/UI | Rejected as duplicate ownership; #913 and existing native attachment/storage paths own source media and evidence truth. Donor Laravel models, SDK coupling and UI are not imported. |
| Operational completion or verification | Rejected as a model-side action. Fresh authority and independent observed evidence are required through canonical execution owners. |

## Verification

The focused Titan visual evidence suite covers unsupported formats, cross-company and wrong-purpose refs, consent mismatch, bounded prompt references, blurry/low-resolution/low-exposure/small-subject/duplicate metrics, checklist incompleteness, offline operation, changed revisions, provider outage/timeout, low-confidence and contradictory findings, review authority, lineage, and independent observed verification. The integrated fixture composes offline capture guidance, a blurry capture and retake signal, before/after comparison, uncertain-finding escalation, a human observation decision, and independent verification without treating model output as proof.

Mobile and web bootstrap integration is not implemented by this runtime slice. Track concrete mobile capture and governed visit closeout wiring in #1340. No model output is completion proof; acceptance remains with the canonical evidence and governance owners.
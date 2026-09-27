# Interface Runtime Recovery Evidence

- Recovery source: certified Titan Interface Runtime v1.0.3 canonical ZIP.
- Certified source SHA-256: `dc3eb44afe004a1206704879ce3748f0f4a32c6328ff00b22d5bc162966afbb0`.
- Certified source inventory: 459 files, including 356 PHP files.
- Damaged reconstructed.5 inventory observed: 50 files / 39 PHP files.
- Files absent from damaged reconstruction but present in certified source: 453.
- Recovery policy: restore certified payload first; preserve newer semantic-runtime additions under non-conflicting contracts/classes; do not rewrite historical pass evidence.
- Canonical boundary after merge: `company_id`; legacy tenant identifiers are compatibility aliases only.
- Canonical surfaces after merge: Zero / Go / Hub; onboarding is a Zero journey.
- Titan Apps convergence metadata is stored in `resources/contracts/titan-apps-interface-runtime.v1.json`; the native v2.2 installer manifest remains closed-schema compliant.

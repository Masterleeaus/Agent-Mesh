# Titan Mobile Pass 60 — certification and release convergence

Pass 60 closes the P51–P60 convergence sequence with fail-closed release gates. A mobile package is not certified merely because source checks pass: iOS/Android signing and physical-device low-connectivity, security, accessibility and performance evidence remain mandatory.

## Security and recovery
- Remote revoke/wipe is company + device scoped and requires a canonical receipt.
- Wipe destroys local identity/key material; it does not claim deletion from customer-controlled external providers.
- Incident repair requires authority contraction, credential rotation, local secret destruction and explicit re-enrollment.
- Hardware-backed key storage is a certification requirement. Existing `flutter_secure_storage` is retained as the platform abstraction; physical hardware-backed attestation is not fabricated by Dart.

## Release/update/rollback
Every candidate requires build SHA-256, signing identity reference, signed manifest reference, and a rollback artifact/digest. Update policy fails closed when these are absent.

## Certification
Required evidence: company boundary, canonical surfaces, authority contraction, offline revalidation, secure key path, remote revocation/wipe, incident repair, signed build, rollback, low-connectivity, security, accessibility and performance.

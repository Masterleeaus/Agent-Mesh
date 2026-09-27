# Titan Apps: Hub — Reconstruction Evidence

This implementation is reconstructed because the original Titan Hub v0.22.1 source archive no longer exists in the supplied project corpus.

Evidence preserved from the current platform:

- CRM compiles against `App\Extensions\TitanHub\System\Contracts\CustomerOperationsGateway` and decorates it rather than replacing Hub operational ownership.
- The exact gateway method surface is preserved so current CRM can decorate the rebuilt Hub.
- CRM owns CRM customer/commercial truth; Field/Bookings/other providers retain operational authority.
- Canonical app surface is `hub`; `customer` remains compatibility-only.
- Per-portal PWA scope is `/customer/{portal}/`.
- Authenticated/private/API requests are never cache-first in the Hub service worker.
- Browser `company_id` / `tenant_company_id` is never accepted as authority.

The implementation intentionally contains no Hub-owned CRM/job/invoice/payment business tables.

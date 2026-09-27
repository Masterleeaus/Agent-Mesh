<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Context;

use App\Extensions\TitanHub\System\Contracts\TrustedCustomerContextResolver;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

final class RequestTrustedCustomerContextResolver implements TrustedCustomerContextResolver
{
    public function resolve(Request $request, string $portal): array
    {
        $actor = $request->user();
        if ((bool) config('hub.security.require_authenticated_actor', true) && ! $actor) {
            throw new AuthorizationException('Authenticated Titan Hub customer is required.');
        }

        $session = $request->hasSession() ? $request->session() : null;
        $canonicalCompanyId = $session?->get('company_id') ?? ($actor?->company_id ?? null);
        $legacyCompanyId = $session?->get('tenant_company_id');

        if ($canonicalCompanyId !== null && $legacyCompanyId !== null && (string) $canonicalCompanyId !== (string) $legacyCompanyId) {
            throw new AuthorizationException('Conflicting legacy tenant context cannot override company_id.');
        }

        $companyId = $canonicalCompanyId ?? $legacyCompanyId;
        $customerId = $session?->get('customer_unification_id') ?? $session?->get('crm_contact_public_id') ?? ($actor?->customer_ref ?? null);

        if ((bool) config('hub.security.reject_client_company_context', true)) {
            foreach (['company_id', 'tenant_company_id', 'tenant_id'] as $untrusted) {
                if ($request->query->has($untrusted) || $request->request->has($untrusted)) {
                    throw new AuthorizationException('Client-supplied company context is not authoritative.');
                }
            }
        }

        if ((bool) config('hub.security.require_company_context', true) && ($companyId === null || (string) $companyId === '' || (int) $companyId < 1)) {
            throw new AuthorizationException('Trusted company_id context is required for Titan Hub.');
        }
        if ((bool) config('hub.security.require_customer_identity', true) && trim((string) $customerId) === '') {
            throw new AuthorizationException('Trusted customer identity is required for Titan Hub.');
        }

        return [
            'surface' => 'hub',
            'journey' => null,
            'portal' => $portal,
            'actor_id' => $actor?->getAuthIdentifier(),
            'actor_type' => 'customer',
            'company_id' => $companyId,
            'customer_identity' => $customerId,
            'customer_ref' => $actor?->customer_ref ?? $customerId,
            'session_id' => $session?->getId(),
            'request_id' => $request->headers->get('X-Request-Id'),
            'locale' => $request->getLocale(),
            'connectivity' => $request->headers->get('X-Titan-Connectivity', 'online'),
        ];
    }
}

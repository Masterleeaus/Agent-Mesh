<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Context;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\AuthenticatedContextPrincipalProviderContract;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Http\Request;
use App\Extensions\TitanInterfaceRuntime\System\Host\TitanHostAuthorizationAdapter;

final readonly class LaravelAuthenticatedContextPrincipalProvider implements AuthenticatedContextPrincipalProviderContract
{
    public function __construct(
        private AuthFactory $auth,
        private ConfigRepository $config,
        private Request $request,
        private TitanHostAuthorizationAdapter $authorization,
    ) {
    }

    public function current(): AuthenticatedContextPrincipal
    {
        $actor = $this->auth->guard()->user();
        if ($actor === null) {
            throw new ContextResolutionException('An authenticated principal is required for interface context resolution.');
        }

        $userId = $actor->getAuthIdentifier();
        if ((! is_int($userId) && ! is_string($userId)) || $userId === '' || (is_numeric($userId) && (int) $userId <= 0)) {
            throw new ContextResolutionException('Authenticated principal has an invalid user_id.');
        }

        $tenantIds = [];
        $trustedTenantAttribute = (string) $this->config->get('titan-interface-runtime.context.trusted_company_request_attribute', 'company_id');
        $trustedTenant = $this->request->attributes->get($trustedTenantAttribute);
        if (is_numeric($trustedTenant) && (int) $trustedTenant > 0) $tenantIds[(int) $trustedTenant] = true;
        elseif (is_string($trustedTenant) && trim($trustedTenant) !== '') $tenantIds[trim($trustedTenant)] = true;
        // Legacy request attributes are compatibility inputs only and must resolve to the same company_id.
        foreach ((array) $this->config->get('titan-interface-runtime.context.legacy_tenant_request_attributes', ['tenant_company_id','tenant_id']) as $legacyAttribute) {
            if (! is_string($legacyAttribute) || $legacyAttribute === '') continue;
            $legacy = $this->request->attributes->get($legacyAttribute);
            if (is_numeric($legacy) && (int) $legacy > 0) $tenantIds[(int) $legacy] = true;
            elseif (is_string($legacy) && trim($legacy) !== '') $tenantIds[trim($legacy)] = true;
        }

        foreach ((array) $this->config->get('titan-interface-runtime.context.tenant_attributes', ['active_company_id', 'current_company_id', 'company_id']) as $attribute) {
            if (! is_string($attribute) || $attribute === '') continue;
            $value = method_exists($actor, 'getAttribute') ? $actor->getAttribute($attribute) : ($actor->{$attribute} ?? null);
            if (is_numeric($value) && (int) $value > 0) $tenantIds[(int) $value] = true;
            elseif (is_string($value) && trim($value) !== '') $tenantIds[trim($value)] = true;
        }

        if (count($tenantIds) !== 1) {
            $reason = $tenantIds === [] ? 'no deterministic company membership' : 'conflicting company/legacy tenant identifiers';
            throw new ContextResolutionException("Interface context resolution failed: {$reason}.");
        }

        return new AuthenticatedContextPrincipal(
            companyId: array_key_first($tenantIds),
            userId: is_numeric($userId) ? (int) $userId : (string) $userId,
            roles: $this->roles($actor),
            capabilities: $this->capabilities($actor),
            teamId: $this->teamId($actor),
        );
    }


    private function teamId(object $actor): ?string
    {
        try {
            if (! method_exists($actor, 'getAttribute')) return null;
            $value = $actor->getAttribute((string) $this->config->get('titan-interface-runtime.context.team_attribute', 'team_id'));
            if (is_numeric($value) && (int) $value > 0) return (string) (int) $value;
            if (is_string($value) && trim($value) !== '') return trim($value);
        } catch (\Throwable) {
        }
        return null;
    }

    /** @return list<string> */
    private function roles(object $actor): array
    {
        try {
            if (method_exists($actor, 'getRoleNames')) {
                return $this->stringList($actor->getRoleNames()->all());
            }
            if (method_exists($actor, 'getAttribute')) {
                $role = $actor->getAttribute('role');
                if (is_string($role) && $role !== '') return [$role];
            }
        } catch (\Throwable) {
        }
        return [];
    }

    /** @return list<string> */
    private function capabilities(object $actor): array
    {
        return $this->authorization->capabilities($actor);
    }

    /** @param array<mixed> $values @return list<string> */
    private function stringList(array $values): array
    {
        $out = [];
        foreach ($values as $value) {
            if (is_string($value) && $value !== '') $out[$value] = true;
        }
        return array_keys($out);
    }
}

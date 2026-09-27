<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Context;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\AuthenticatedContextPrincipalProviderContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextResolverContract;

final readonly class InterfaceContextResolver implements InterfaceContextResolverContract
{
    /** @param list<string> $allowedProductSurfaces */
    public function __construct(
        private AuthenticatedContextPrincipalProviderContract $principalProvider,
        private array $allowedProductSurfaces,
        private string $defaultProductSurface,
        private string $defaultDomain,
    ) {
        if ($allowedProductSurfaces === [] || ! in_array($defaultProductSurface, $allowedProductSurfaces, true)) {
            throw new ContextResolutionException('Context resolver requires a valid default product_surface.');
        }
    }

    /** @param array<string, scalar|null> $overrides */
    public function resolve(array $overrides = []): InterfaceContext
    {
        $principal = $this->principalProvider->current();
        $this->assertSecurityOverrides($principal, $overrides);

        $surface = $this->stringOverride($overrides, 'product_surface', $this->defaultProductSurface);
        if (! in_array($surface, $this->allowedProductSurfaces, true)) {
            throw new ContextResolutionException("product_surface '{$surface}' is not enabled for Titan Interface Runtime.");
        }

        $domain = $this->stringOverride($overrides, 'domain', $this->defaultDomain);
        $traceId = $this->stringOverride($overrides, 'trace_id', $this->newId('trace'));
        $correlationId = $this->stringOverride($overrides, 'correlation_id', $this->newId('corr'));

        return new InterfaceContext(
            companyId: $principal->companyId,
            userId: $principal->userId,
            productSurface: $surface,
            domain: $domain,
            branchId: $this->nullableIntOverride($overrides, 'branch_id'),
            workspaceId: $this->nullableStringOverride($overrides, 'workspace_id'),
            teamId: array_key_exists('team_id', $overrides)
                ? $this->nullableStringOverride($overrides, 'team_id')
                : $principal->teamId,
            deviceId: $this->nullableStringOverride($overrides, 'device_id'),
            objectRef: $this->nullableStringOverride($overrides, 'object_ref'),
            conversationId: $this->nullableStringOverride($overrides, 'conversation_id'),
            journeyId: $this->nullableStringOverride($overrides, 'journey_id'),
            roles: $principal->roles,
            capabilities: $principal->capabilities,
            traceId: $traceId,
            correlationId: $correlationId,
            causationId: $this->nullableStringOverride($overrides, 'causation_id'),
        );
    }

    /** @param array<string, scalar|null> $overrides */
    private function assertSecurityOverrides(AuthenticatedContextPrincipal $principal, array $overrides): void
    {
        foreach (['roles', 'capabilities'] as $field) {
            if (array_key_exists($field, $overrides)) {
                throw new ContextResolutionException("{$field} cannot be supplied by an interface caller.");
            }
        }

        $canonical = $overrides['company_id'] ?? null;
        $legacyCompany = $overrides['tenant_company_id'] ?? null;
        $legacyTenant = $overrides['tenant_id'] ?? null;
        foreach ([$canonical, $legacyCompany, $legacyTenant] as $candidate) {
            if ($candidate !== null && (string) $candidate !== (string) $principal->companyId) {
                throw new ContextResolutionException('company_id override (including legacy tenant_company_id/tenant_id aliases) does not match the authenticated principal company_id.');
            }
        }
        if ($canonical !== null && $legacyCompany !== null && (string) $canonical !== (string) $legacyCompany) {
            throw new ContextResolutionException('Legacy tenant_company_id cannot override company_id.');
        }
        if ($legacyCompany !== null && $legacyTenant !== null && (string) $legacyCompany !== (string) $legacyTenant) {
            throw new ContextResolutionException('Conflicting legacy tenant compatibility inputs.');
        }
        if (array_key_exists('user_id', $overrides) && $overrides['user_id'] != $principal->userId) {
            throw new ContextResolutionException('user_id override does not match the authenticated principal.');
        }
    }

    /** @param array<string, scalar|null> $overrides */
    private function stringOverride(array $overrides, string $key, string $default): string
    {
        if (! array_key_exists($key, $overrides)) return $default;
        $value = $overrides[$key];
        if (! is_string($value) || $value === '') throw new ContextResolutionException("{$key} must be a non-empty string.");
        return $value;
    }

    /** @param array<string, scalar|null> $overrides */
    private function nullableStringOverride(array $overrides, string $key): ?string
    {
        if (! array_key_exists($key, $overrides) || $overrides[$key] === null) return null;
        if (! is_string($overrides[$key])) throw new ContextResolutionException("{$key} must be a string or null.");
        return $overrides[$key];
    }

    /** @param array<string, scalar|null> $overrides */
    private function nullableIntOverride(array $overrides, string $key): ?int
    {
        if (! array_key_exists($key, $overrides) || $overrides[$key] === null) return null;
        $value = $overrides[$key];
        if (is_int($value)) return $value;
        if (is_string($value) && ctype_digit($value)) return (int) $value;
        throw new ContextResolutionException("{$key} must be an integer or null.");
    }

    private function newId(string $prefix): string
    {
        return $prefix . '-' . bin2hex(random_bytes(16));
    }
}

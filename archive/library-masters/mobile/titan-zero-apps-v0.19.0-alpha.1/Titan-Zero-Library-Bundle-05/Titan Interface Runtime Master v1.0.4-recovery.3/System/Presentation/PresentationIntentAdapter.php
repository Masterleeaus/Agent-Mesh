<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

use App\Extensions\TitanInterfaceRuntime\System\Surface\CanonicalSurfaceResolver;
use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;

final class PresentationIntentAdapter
{
    public function __construct(private CanonicalSurfaceResolver $surfaces) {}

    /** @param array<string,mixed> $intent */
    public function context(array $intent): InterfaceContext
    {
        $resolution = $this->surfaces->resolve(
            (string) ($intent['surface'] ?? 'zero'),
            isset($intent['journey']) ? (string) $intent['journey'] : null
        );

        $companyId = $this->resolveCompanyId($intent);

        return new InterfaceContext(
            $resolution->surface,
            $resolution->journey,
            $companyId,
            $intent['actor_id'] ?? null,
            $intent['permissions'] ?? [],
            $intent['projection'] ?? [],
            $intent['device'] ?? [],
            $intent['connectivity'] ?? [],
            $intent['presentation'] ?? []
        );
    }

    /** @param array<string,mixed> $intent */
    private function resolveCompanyId(array $intent): string|int|null
    {
        $canonical = $intent['company_id'] ?? null;
        $legacyCompany = $intent['company_id'] ?? null;
        $legacyTenant = $intent['company_id'] ?? null;

        foreach ([$legacyCompany, $legacyTenant] as $legacy) {
            if ($canonical !== null && $legacy !== null && (string) $canonical !== (string) $legacy) {
                throw new \InvalidArgumentException('Legacy tenant context cannot override company_id.');
            }
        }

        if ($legacyCompany !== null && $legacyTenant !== null && (string) $legacyCompany !== (string) $legacyTenant) {
            throw new \InvalidArgumentException('Conflicting legacy tenant compatibility inputs.');
        }

        return $canonical ?? $legacyCompany ?? $legacyTenant;
    }
}

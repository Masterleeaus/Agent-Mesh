<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Navigation;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Navigation\NavigationProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Surfaces\IntentSurfaceCatalog;

final readonly class RegistryNavigationProjector implements NavigationProjectorContract
{
    public function __construct(private DomainRegistryContract $domains)
    {
    }

    public function project(string $productSurface, ?string $activeDomain = null, string $activeIntent = 'home'): NavigationProjection
    {
        if (! IntentSurfaceCatalog::contains($activeIntent)) {
            throw new \InvalidArgumentException("Unknown active intent surface '{$activeIntent}'.");
        }

        $items = [];
        foreach ($this->domains->visibleFor($productSurface) as $domain) {
            $intentItems = [];
            foreach ($domain->intentSurfaces as $intent) {
                $intentItems[] = [
                    'key' => $intent,
                    'label' => IntentSurfaceCatalog::label($intent),
                    'active' => $domain->key === $activeDomain && $intent === $activeIntent,
                ];
            }

            $items[] = [
                'key' => $domain->key,
                'label' => $domain->label,
                'layer' => $domain->layer,
                'priority' => $domain->priority,
                'active' => $domain->key === $activeDomain,
                'intent_surfaces' => $intentItems,
            ];
        }

        return new NavigationProjection($productSurface, $activeDomain, $activeIntent, $items);
    }
}

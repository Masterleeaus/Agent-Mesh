<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;
use App\Extensions\TitanAppsCore\System\Support\AppIdentity;

final class TitanAppsDiscoveryService
{
    /** @return list<AppIdentity> */
    public function applications(): array
    {
        $rows = (array) config('titan-apps-core.surfaces', []);
        $apps = [];
        foreach ([AppSurface::Zero, AppSurface::Go, AppSurface::Hub] as $surface) {
            $definition = (array) ($rows[$surface->value] ?? []);
            $apps[] = new AppIdentity(
                appId: (string) ($definition['app_id'] ?? 'titan-apps-'.$surface->value),
                displayName: (string) ($definition['display_name'] ?? ('Titan '.ucfirst($surface->value))),
                surface: $surface,
            );
        }
        return $apps;
    }

    public function forSurface(string|AppSurface $surface): AppIdentity
    {
        $surface = $surface instanceof AppSurface ? $surface : AppSurface::resolve($surface);
        foreach ($this->applications() as $identity) {
            if ($identity->surface === $surface) return $identity;
        }
        throw new \LogicException('Titan Apps surface is not registered: '.$surface->value);
    }

    /** @return array<string,array<string,mixed>> */
    public function catalogue(): array
    {
        $result = [];
        foreach ($this->applications() as $app) {
            $result[$app->surface->value] = $app->toArray();
        }
        return $result;
    }
}

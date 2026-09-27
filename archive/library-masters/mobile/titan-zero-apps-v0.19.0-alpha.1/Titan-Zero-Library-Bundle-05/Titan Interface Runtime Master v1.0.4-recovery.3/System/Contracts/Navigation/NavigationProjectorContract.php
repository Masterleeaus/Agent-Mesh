<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Navigation;

use App\Extensions\TitanInterfaceRuntime\System\Navigation\NavigationProjection;

interface NavigationProjectorContract
{
    public function project(string $productSurface, ?string $activeDomain = null, string $activeIntent = 'home'): NavigationProjection;
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Data;

interface LegacyRouteLocatorContract
{
    public function url(string $routeName): ?string;
}

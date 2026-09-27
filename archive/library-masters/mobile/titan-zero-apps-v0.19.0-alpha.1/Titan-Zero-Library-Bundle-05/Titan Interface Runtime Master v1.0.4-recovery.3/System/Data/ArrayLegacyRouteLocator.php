<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Data;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\LegacyRouteLocatorContract;

final readonly class ArrayLegacyRouteLocator implements LegacyRouteLocatorContract
{
    /** @param array<string,string> $routes */
    public function __construct(private array $routes) {}
    public function url(string $routeName): ?string { return $this->routes[$routeName]??null; }
}

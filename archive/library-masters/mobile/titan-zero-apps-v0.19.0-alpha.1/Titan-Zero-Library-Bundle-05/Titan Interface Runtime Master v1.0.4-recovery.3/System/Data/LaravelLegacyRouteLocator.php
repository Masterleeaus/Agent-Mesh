<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Data;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Data\LegacyRouteLocatorContract;
use Illuminate\Contracts\Routing\UrlGenerator;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

final readonly class LaravelLegacyRouteLocator implements LegacyRouteLocatorContract
{
    public function __construct(private UrlGenerator $urls) {}
    public function url(string $routeName): ?string
    {
        try { return $this->urls->route($routeName, [], false); }
        catch (RouteNotFoundException|\InvalidArgumentException) { return null; }
    }
}

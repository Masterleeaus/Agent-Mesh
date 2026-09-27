<?php

declare(strict_types=1);

namespace Tests\Fakes\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\RoutingProvider;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixElement;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixResult;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteResult;

final class FakeRoutingProvider implements RoutingProvider
{
    public function id(): string { return 'fake-routing'; }

    public function route(RouteRequest $request): RouteResult
    {
        return new RouteResult($this->id(), 4200, 900, 780, $request->isTrafficAware(), 'fake-polyline', new ProviderUsage($this->id(), 'compute_route'));
    }

    public function matrix(RouteMatrixRequest $request): RouteMatrixResult
    {
        $elements = [];
        foreach ($request->origins as $oi => $_origin) {
            foreach ($request->destinations as $di => $_destination) {
                $elements[] = new RouteMatrixElement($oi, $di, 1000 + ($oi * 100) + $di, 300 + ($oi * 10) + $di, 240, 'ROUTE_EXISTS');
            }
        }
        return new RouteMatrixResult($this->id(), $elements, $request->isTrafficAware(), new ProviderUsage($this->id(), 'compute_route_matrix', 1, count($elements), (float) count($elements)));
    }
}

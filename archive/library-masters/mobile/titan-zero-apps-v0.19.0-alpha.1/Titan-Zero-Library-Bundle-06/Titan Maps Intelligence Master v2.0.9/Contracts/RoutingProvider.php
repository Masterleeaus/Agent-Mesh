<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixResult;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteResult;

interface RoutingProvider
{
    public function id(): string;
    public function route(RouteRequest $request): RouteResult;
    public function matrix(RouteMatrixRequest $request): RouteMatrixResult;
}

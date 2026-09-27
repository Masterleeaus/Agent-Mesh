<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\TrafficEstimate;

interface TrafficProvider
{
    public function id(): string;
    public function traffic(RouteRequest $request): TrafficEstimate;
}

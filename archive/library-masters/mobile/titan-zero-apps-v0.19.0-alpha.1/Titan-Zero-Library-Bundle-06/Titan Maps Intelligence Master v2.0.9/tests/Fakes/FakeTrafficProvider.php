<?php

declare(strict_types=1);

namespace Tests\Fakes\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\TrafficProvider;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\TrafficEstimate;

final class FakeTrafficProvider implements TrafficProvider
{
    public function id(): string { return 'fake-traffic'; }

    public function traffic(RouteRequest $request): TrafficEstimate
    {
        return new TrafficEstimate($this->id(), 900, 780, 120, 'traffic_aware', new ProviderUsage($this->id(), 'traffic_estimate'));
    }
}

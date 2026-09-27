<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;

interface SpatialSignalPublisher
{
    public function publish(string $eventType, SpatialExecutionContext $context, array $payload = []): ?string;
}

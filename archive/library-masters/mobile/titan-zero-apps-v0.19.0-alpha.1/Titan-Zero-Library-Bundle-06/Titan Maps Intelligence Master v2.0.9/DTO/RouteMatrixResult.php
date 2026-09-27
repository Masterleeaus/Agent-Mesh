<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class RouteMatrixResult
{
    public function __construct(
        public string $provider,
        public array $elements,
        public bool $trafficAware,
        public ProviderUsage $usage,
    ) {}
}

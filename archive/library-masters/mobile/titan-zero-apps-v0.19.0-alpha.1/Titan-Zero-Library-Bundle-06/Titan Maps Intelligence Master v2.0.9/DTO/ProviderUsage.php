<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class ProviderUsage
{
    public function __construct(
        public string $provider,
        public string $operation,
        public int $requestCount = 1,
        public int $resultCount = 0,
        public float $billableUnits = 1.0,
        public ?float $estimatedCost = null,
        public ?string $currency = null,
    ) {}
}

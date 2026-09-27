<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class TrafficEstimate
{
    public function __construct(
        public string $provider,
        public int $durationSeconds,
        public ?int $staticDurationSeconds,
        public ?int $delaySeconds,
        public string $basis,
        public ProviderUsage $usage,
    ) {}
}

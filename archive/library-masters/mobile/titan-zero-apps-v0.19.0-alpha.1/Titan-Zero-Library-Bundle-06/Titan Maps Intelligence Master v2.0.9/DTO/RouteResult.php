<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class RouteResult
{
    public function __construct(
        public string $provider,
        public int $distanceMetres,
        public int $durationSeconds,
        public ?int $staticDurationSeconds,
        public bool $trafficAware,
        public ?string $encodedPolyline,
        public ProviderUsage $usage,
    ) {}

    public function trafficDelaySeconds(): ?int
    {
        if (! $this->trafficAware || $this->staticDurationSeconds === null) {
            return null;
        }

        return max(0, $this->durationSeconds - $this->staticDurationSeconds);
    }
}

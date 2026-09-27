<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class RouteMatrixElement
{
    public function __construct(
        public int $originIndex,
        public int $destinationIndex,
        public ?int $distanceMetres,
        public ?int $durationSeconds,
        public ?int $staticDurationSeconds,
        public string $condition,
    ) {}

    public function trafficDelaySeconds(): ?int
    {
        if ($this->durationSeconds === null || $this->staticDurationSeconds === null) {
            return null;
        }

        return max(0, $this->durationSeconds - $this->staticDurationSeconds);
    }
}

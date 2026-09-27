<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class TerritoryMatchResult
{
    public function __construct(
        public bool $matched,
        public string $basis,
        public ?float $distanceMetres = null,
        public ?int $durationSeconds = null,
        public array $evidence = [],
    ) {}
}

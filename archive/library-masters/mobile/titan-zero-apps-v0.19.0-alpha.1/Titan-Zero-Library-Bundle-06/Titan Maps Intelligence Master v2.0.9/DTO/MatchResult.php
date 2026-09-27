<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class MatchResult
{
    public function __construct(
        public float $score,
        public string $status,
        public array $matchingFields,
        public array $conflictingFields,
        public array $breakdown,
    ) {}
}

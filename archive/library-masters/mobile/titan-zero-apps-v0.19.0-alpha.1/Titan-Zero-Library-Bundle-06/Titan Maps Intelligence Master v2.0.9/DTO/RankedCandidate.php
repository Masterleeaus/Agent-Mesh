<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class RankedCandidate
{
    public function __construct(public float $score, public array $breakdown) {}
}

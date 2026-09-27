<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class ResourceFallbackScoreResult
{
    /** @param array<string,mixed> $dimensions @param array<string,mixed> $evidence @param array<int,string> $explanations */
    public function __construct(
        public float $totalScore,
        public bool $eligible,
        public array $dimensions,
        public array $evidence,
        public array $explanations,
    ) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'total_score'=>$this->totalScore,
            'eligible'=>$this->eligible,
            'dimensions'=>$this->dimensions,
            'evidence'=>$this->evidence,
            'explanations'=>$this->explanations,
        ];
    }
}

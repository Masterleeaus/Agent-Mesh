<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class DispatchScoreResult
{
    /** @param array<string,float> $dimensions @param array<string,mixed> $evidence @param array<int,string> $blockers @param array<int,string> $explanations */
    public function __construct(
        public float $totalScore,
        public bool $blocked,
        public array $dimensions,
        public array $evidence,
        public array $blockers,
        public array $explanations,
    ) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'total_score'=>$this->totalScore,
            'blocked'=>$this->blocked,
            'dimensions'=>$this->dimensions,
            'evidence'=>$this->evidence,
            'blockers'=>$this->blockers,
            'explanations'=>$this->explanations,
        ];
    }
}

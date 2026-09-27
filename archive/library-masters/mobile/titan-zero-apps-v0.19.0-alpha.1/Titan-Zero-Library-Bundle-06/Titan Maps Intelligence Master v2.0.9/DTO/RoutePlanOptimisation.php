<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final class RoutePlanOptimisation
{
    /**
     * @param array<int,RoutePlanStopInput> $orderedStops
     * @param array<int,array<string,mixed>> $schedule
     * @param array<int,array<string,mixed>> $windowViolations
     */
    public function __construct(
        public readonly array $orderedStops,
        public readonly int $baselineDurationSeconds,
        public readonly int $optimisedDurationSeconds,
        public readonly int $baselineDistanceMetres,
        public readonly int $optimisedDistanceMetres,
        public readonly int $durationSavingsSeconds,
        public readonly int $distanceSavingsMetres,
        public readonly array $schedule,
        public readonly array $windowViolations,
        public readonly string $algorithm = 'locked_greedy_time_window_v1',
        public readonly bool $heuristicUsed = false,
        public readonly bool $timedOut = false,
        public readonly int $elapsedMilliseconds = 0,
    ) {}
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

final class ResultLimitService
{
    public function remaining(int $maximum, int $processed): int
    {
        return max(0, $maximum - max(0, $processed));
    }

    public function take(array $items, int $remaining): array
    {
        if ($remaining <= 0) {
            return [];
        }

        return array_slice(array_values($items), 0, $remaining);
    }
}

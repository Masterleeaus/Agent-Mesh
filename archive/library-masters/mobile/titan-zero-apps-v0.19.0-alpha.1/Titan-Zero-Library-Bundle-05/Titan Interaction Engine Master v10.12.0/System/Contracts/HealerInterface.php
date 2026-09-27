<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface HealerInterface
{
    public function detectAnomalies(): array;
    public function heal(int $runId): void;
    public function prevent(array $pattern): void;
}

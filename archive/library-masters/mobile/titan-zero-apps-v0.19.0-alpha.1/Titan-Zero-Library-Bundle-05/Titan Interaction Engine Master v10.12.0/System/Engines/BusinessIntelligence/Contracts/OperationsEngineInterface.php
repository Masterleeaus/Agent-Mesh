<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts;

interface OperationsEngineInterface
{
    public function optimize(string $area, array $data): array;
    public function getPerformanceMetrics(): array;
    public function suggestImprovements(string $area): array;
}

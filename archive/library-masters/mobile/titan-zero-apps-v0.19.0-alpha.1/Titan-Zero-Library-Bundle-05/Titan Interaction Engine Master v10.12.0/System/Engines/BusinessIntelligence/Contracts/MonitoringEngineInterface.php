<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts;

interface MonitoringEngineInterface
{
    public function getStatus(): array;
    public function getMetrics(): array;
    public function setAlert(string $metric, float $threshold): void;
}

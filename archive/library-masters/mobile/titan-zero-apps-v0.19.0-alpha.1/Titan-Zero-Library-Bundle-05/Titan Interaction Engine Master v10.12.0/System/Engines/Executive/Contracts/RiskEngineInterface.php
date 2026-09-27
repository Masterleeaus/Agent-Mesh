<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Contracts;

interface RiskEngineInterface
{
    public function assess(array $context): array;
    public function getRisks(): array;
    public function mitigate(string $risk, string $strategy): void;
    public function getRiskScore(array $context): float;
}

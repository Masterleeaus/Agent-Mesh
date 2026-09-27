<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface EvaluationEngineInterface
{
    public function evaluate(string $input, string $output): float;
    public function compare(string $input, string $output1, string $output2): array;
    public function getEvaluationMetrics(): array;
}

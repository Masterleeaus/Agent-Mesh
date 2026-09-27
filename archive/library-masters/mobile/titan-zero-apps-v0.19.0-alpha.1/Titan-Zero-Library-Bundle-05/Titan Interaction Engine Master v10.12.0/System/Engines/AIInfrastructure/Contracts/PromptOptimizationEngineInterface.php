<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface PromptOptimizationEngineInterface
{
    public function optimize(string $prompt): string;
    public function evaluate(string $prompt): float;
    public function suggestImprovements(string $prompt): array;
}

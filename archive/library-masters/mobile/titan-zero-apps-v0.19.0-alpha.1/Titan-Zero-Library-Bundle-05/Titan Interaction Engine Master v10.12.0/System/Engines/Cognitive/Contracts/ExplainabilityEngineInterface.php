<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts;

interface ExplainabilityEngineInterface
{
    public function explain(string $decision, array $context): string;
    public function getReasons(string $decision): array;
    public function visualize(string $decision): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Contracts;

interface PredictionEngineInterface
{
    public function predict(string $target, array $features): mixed;
    public function batchPredict(array $targets, array $features): array;
    public function getConfidence(): float;
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface PredictorInterface
{
    public function predict(int $userId, array $context): array;
    public function getConfidence(array $prediction): float;
    public function recordOutcome(array $prediction, bool $success): void;
}

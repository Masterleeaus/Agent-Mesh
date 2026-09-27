<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Contracts;

interface FeedbackEngineInterface
{
    public function collect(int $userId, string $type, array $data): void;
    public function getFeedback(int $userId, string $type): array;
    public function analyze(array $feedback): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Contracts;

interface BehaviourLearningEngineInterface
{
    public function recordAction(int $userId, string $action, array $context): void;
    public function getBehaviourProfile(int $userId): array;
    public function predictNextAction(int $userId): ?string;
}

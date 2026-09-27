<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

interface LearnerInterface
{
    public function learn(int $userId, array $event): void;
    public function getPatterns(int $userId): array;
    public function getSuggestions(int $userId, array $context): array;
}

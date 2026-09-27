<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Contracts;

interface PreferenceLearningEngineInterface
{
    public function recordPreference(int $userId, string $key, $value): void;
    public function getPreference(int $userId, string $key);
    public function getAllPreferences(int $userId): array;
}

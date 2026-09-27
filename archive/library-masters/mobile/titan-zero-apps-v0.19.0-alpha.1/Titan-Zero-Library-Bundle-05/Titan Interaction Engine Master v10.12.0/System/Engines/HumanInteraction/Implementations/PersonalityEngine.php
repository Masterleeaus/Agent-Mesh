<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\PersonalityEngineInterface;

/**
 * Signal-based personality inference from $context, and a real profile
 * store that adapt() actually writes to. Fixed during the fix pass:
 * detect() always returned 'analytical'/0.7 regardless of $context, and
 * adapt() was a no-op, so getProfile() could never return anything
 * adapt() had set.
 */
class PersonalityEngine implements PersonalityEngineInterface
{
    private array $profiles = [];

    public function detect(array $context): array
    {
        $text = is_string($context['text'] ?? null) ? $context['text'] : implode(' ', array_filter($context, 'is_string'));
        $numericRatio = $this->numericSignalRatio($context);
        $exclamations = substr_count($text, '!');
        $questions = substr_count($text, '?');

        [$personality, $confidence] = match (true) {
            $numericRatio > 0.3 => ['analytical', min(0.9, 0.5 + $numericRatio)],
            $exclamations >= 2 => ['expressive', min(0.9, 0.5 + $exclamations * 0.1)],
            $questions >= 2 => ['curious', min(0.9, 0.5 + $questions * 0.1)],
            default => ['neutral', 0.4],
        };

        return ['personality' => $personality, 'confidence' => round($confidence, 2)];
    }

    public function getProfile(int $userId): array
    {
        return $this->profiles[$userId] ?? ['personality' => 'unknown'];
    }

    public function adapt(array $profile): void
    {
        $userId = $profile['user_id'] ?? null;
        if ($userId !== null) {
            $this->profiles[$userId] = $profile;
        }
    }

    private function numericSignalRatio(array $context): float
    {
        if (empty($context)) {
            return 0.0;
        }
        $numeric = array_filter($context, 'is_numeric');
        return count($numeric) / count($context);
    }
}

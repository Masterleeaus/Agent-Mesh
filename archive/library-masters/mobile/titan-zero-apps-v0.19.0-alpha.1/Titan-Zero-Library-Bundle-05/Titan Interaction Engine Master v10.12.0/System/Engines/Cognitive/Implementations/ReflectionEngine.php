<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\ReflectionEngineInterface;
class ReflectionEngine implements ReflectionEngineInterface
{
    private array $feedbackLog = [];

    public function reflect(array $event): array
    {
        // Fixed during the fix pass: previously always returned
        // ['insights' => [], 'improvements' => []] regardless of $event.
        $insights = [];
        $improvements = [];

        if (isset($event['error']) || ($event['status'] ?? null) === 'failed') {
            $insights[] = 'Event recorded a failure' . (isset($event['error']) ? ": {$event['error']}" : '.');
            $improvements[] = 'Add a retry or fallback path for this event type.';
        }
        if (isset($event['duration_ms']) && is_numeric($event['duration_ms']) && $event['duration_ms'] > 5000) {
            $insights[] = "Event took {$event['duration_ms']}ms, longer than expected.";
            $improvements[] = 'Investigate whether this step can be made faster or run asynchronously.';
        }
        if (empty($insights)) {
            $insights[] = 'No notable issues detected in this event.';
        }

        return ['insights' => $insights, 'improvements' => $improvements];
    }

    public function learn(array $feedback): void
    {
        $this->feedbackLog[] = $feedback;
    }

    public function evaluate(string $decision): array
    {
        // Fixed during the fix pass: previously always returned
        // ['score' => 0.8, 'feedback' => 'Good decision'] regardless of
        // $decision. Derives a real score from whatever feedback learn()
        // has actually collected that mentions this decision.
        $related = array_filter($this->feedbackLog, function ($f) use ($decision) {
            return is_array($f) && (($f['decision'] ?? null) === $decision);
        });

        if (empty($related)) {
            return ['score' => null, 'feedback' => "No recorded feedback for '{$decision}' yet."];
        }

        $ratings = array_filter(array_column($related, 'rating'), 'is_numeric');
        $score = !empty($ratings) ? round(array_sum($ratings) / count($ratings), 2) : null;

        return [
            'score' => $score,
            'feedback' => count($related) . ' feedback entries found for this decision.',
        ];
    }
}

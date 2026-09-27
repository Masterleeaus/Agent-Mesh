<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Learner;

use App\Extensions\InteractionEngine\System\Contracts\LearnerInterface;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Events\InteractionCompleted;
use Illuminate\Support\Facades\Cache;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

class LearnerEngine implements LearnerInterface
{
    private InteractionRegistry $registry;
    private array $patterns = [];

    public function __construct(InteractionRegistry $registry, private readonly CompanyExecutionContext $tenantContext)
    {
        $this->registry = $registry;
        $this->loadPatterns();
    }

    public function learn(int $userId, array $event): void
    {
        $patternKey = $event['type'] ?? 'unknown';
        $userIdKey = $this->tenantContext->cacheKey('user_learned:' . $userId);

        $patterns = Cache::get($userIdKey, []);
        $patterns[$patternKey][] = [
            'event' => $event,
            'timestamp' => now(),
            'context' => $event['context'] ?? [],
        ];

        // Keep only last 100 events per pattern
        if (count($patterns[$patternKey]) > 100) {
            array_shift($patterns[$patternKey]);
        }

        Cache::put($userIdKey, $patterns, 86400 * 30);
    }

    public function getPatterns(int $userId): array
    {
        return Cache::get($this->tenantContext->cacheKey('user_learned:' . $userId), []);
    }

    public function getSuggestions(int $userId, array $context): array
    {
        $patterns = $this->getPatterns($userId);
        $suggestions = [];

        // Find patterns that match the current context
        foreach ($patterns as $type => $events) {
            $lastEvents = array_slice($events, -5);
            foreach ($lastEvents as $event) {
                if ($this->matchesContext($event, $context)) {
                    $suggestions[] = [
                        'type' => $type,
                        'suggestion' => $this->generateSuggestion($type, $event),
                        'confidence' => $this->calculateConfidence($events),
                    ];
                }
            }
        }

        return $suggestions;
    }

    private function matchesContext(array $event, array $context): bool
    {
        $eventContext = $event['context'] ?? [];
        foreach ($eventContext as $key => $value) {
            if (isset($context[$key]) && $context[$key] !== $value) {
                return false;
            }
        }
        return true;
    }

    private function generateSuggestion(string $type, array $event): string
    {
        $suggestions = [
            'interaction_started' => 'You started this interaction before. Would you like to resume?',
            'interaction_completed' => 'You completed this interaction. Would you like to do it again?',
            'question_answered' => 'Based on your previous answers, I can help with this.',
        ];
        return $suggestions[$type] ?? 'I have a suggestion based on your history.';
    }

    private function calculateConfidence(array $events): float
    {
        $successful = 0;
        $total = count($events);
        foreach ($events as $event) {
            if (isset($event['success']) && $event['success']) {
                $successful++;
            }
        }
        return $total > 0 ? ($successful / $total) : 0.5;
    }

    private function loadPatterns(): void
    {
        // Load known patterns from database or config
        $this->patterns = config('interaction-engine.patterns', []);
    }
}

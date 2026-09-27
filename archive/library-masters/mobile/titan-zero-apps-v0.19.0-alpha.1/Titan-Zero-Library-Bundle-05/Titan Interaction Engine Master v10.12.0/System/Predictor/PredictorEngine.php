<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Predictor;

use App\Extensions\InteractionEngine\System\Contracts\PredictorInterface;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Context\ContextBuilder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

class PredictorEngine implements PredictorInterface
{
    private InteractionRegistry $registry;
    private ContextBuilder $contextBuilder;
    private array $predictors = [];

    public function __construct(
        InteractionRegistry $registry,
        ContextBuilder $contextBuilder,
        private readonly CompanyExecutionContext $tenantContext,
    ) {
        $this->registry = $registry;
        $this->contextBuilder = $contextBuilder;
        $this->registerDefaultPredictors();
    }

    public function predict(int $userId, array $context): array
    {
        $predictions = [];

        foreach ($this->predictors as $name => $predictor) {
            try {
                $result = $predictor($userId, $context);
                if ($result && isset($result['interaction_id'])) {
                    $predictions[] = [
                        'predictor' => $name,
                        'interaction_id' => $result['interaction_id'],
                        'confidence' => $this->getConfidence($result),
                        'reason' => $result['reason'] ?? null,
                        'priority' => $result['priority'] ?? 'medium',
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning("Predictor '{$name}' failed", ['error' => $e->getMessage()]);
            }
        }

        // Sort by confidence
        usort($predictions, fn($a, $b) => $b['confidence'] <=> $a['confidence']);

        return $predictions;
    }

    public function getConfidence(array $prediction): float
    {
        return $prediction['confidence'] ?? 0.5;
    }

    public function recordOutcome(array $prediction, bool $success): void
    {
        // Store outcome for learning
        $key = $this->tenantContext->cacheKey('prediction_outcome:' . md5(serialize($prediction)));
        Cache::put($key, [
            'prediction' => $prediction,
            'success' => $success,
            'timestamp' => now(),
        ], 86400 * 30);

        // Update confidence weights
        $this->updateWeights($prediction, $success);
    }

    private function registerDefaultPredictors(): void
    {
        // Predict based on user history
        $this->registerPredictor('history', function($userId, $context) {
            $history = $this->getUserHistory($userId);
            if (empty($history)) {
                return null;
            }
            $last = end($history);
            return [
                'interaction_id' => $last['interaction_id'],
                'confidence' => 0.6,
                'reason' => 'Based on your previous interaction',
                'priority' => 'medium',
            ];
        });

        // Predict based on time of day
        $this->registerPredictor('time_of_day', function($userId, $context) {
            $hour = date('H');
            if ($hour >= 6 && $hour < 12) {
                return [
                    'interaction_id' => 'morning_checkin',
                    'confidence' => 0.4,
                    'reason' => 'Good morning! Ready to start your day?',
                    'priority' => 'low',
                ];
            }
            if ($hour >= 16 && $hour < 20) {
                return [
                    'interaction_id' => 'end_of_day',
                    'confidence' => 0.5,
                    'reason' => 'Time to wrap up?',
                    'priority' => 'medium',
                ];
            }
            return null;
        });

        // Predict based on context (e.g., customer selected)
        $this->registerPredictor('context', function($userId, $context) {
            if (isset($context['customer_id'])) {
                // If customer has recent quotes, predict quote interaction
                // If customer has recent jobs, predict job interaction
                return [
                    'interaction_id' => 'create_quote',
                    'confidence' => 0.7,
                    'reason' => 'Customer ' . ($context['customer_name'] ?? '') . ' has recent activity',
                    'priority' => 'high',
                ];
            }
            return null;
        });

        // Predict based on scheduled events
        $this->registerPredictor('scheduled', function($userId, $context) {
            // Check for scheduled jobs, meetings, etc.
            return null;
        });
    }

    public function registerPredictor(string $name, callable $predictor): void
    {
        $this->predictors[$name] = $predictor;
    }

    private function getUserHistory(int $userId): array
    {
        try {
            return \App\Extensions\InteractionEngine\System\Models\InteractionEvent::query()
                ->where('company_id', $this->tenantContext->companyId())
                ->where('event_type', 'interaction_completed')
                ->where('data->user_id', $userId)
                ->orderByDesc('occurred_at')
                ->limit(20)
                ->limit(5000)->get()
                ->map(static fn($event): array => (array) ($event->data ?? []))
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }

    private function updateWeights(array $prediction, bool $success): void
    {
        // Update confidence weights based on success
        $key = $this->tenantContext->cacheKey('prediction_weights:' . $prediction['interaction_id']);
        $weights = Cache::get($key, ['total' => 0, 'success' => 0]);
        $weights['total']++;
        if ($success) {
            $weights['success']++;
        }
        Cache::put($key, $weights, 86400 * 30);
    }
}

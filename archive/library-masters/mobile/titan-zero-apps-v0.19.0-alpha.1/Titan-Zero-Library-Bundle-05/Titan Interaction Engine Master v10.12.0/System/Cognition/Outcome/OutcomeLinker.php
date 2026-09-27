<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Outcome;

use DomainException;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType;

final class OutcomeLinker
{
    public function __construct(private readonly CognitiveEventStoreInterface $store) {}

    public function linkAndScore(string $companyId, string $predictionEventId, string $outcomeEventId): CognitiveEvent
    {
        $prediction = $this->store->find($companyId, $predictionEventId);
        $outcome = $this->store->find($companyId, $outcomeEventId);
        if ($prediction === null || $outcome === null) {
            throw new DomainException('Prediction and outcome must exist in the same tenant.');
        }
        $predictedAction = (string) ($prediction->payload['proposed_action'] ?? '');
        $actualAction = (string) ($outcome->payload['action'] ?? '');
        $successful = (bool) ($outcome->payload['success'] ?? false);
        $matched = $successful && $predictedAction !== '' && hash_equals($predictedAction, $actualAction);
        $probability = $prediction->confidence ?? 0.5;
        $observed = $matched ? 1.0 : 0.0;
        $brier = ($probability - $observed) ** 2;

        $score = CognitiveEvent::create(
            type: CognitiveEventType::PredictionScored,
            companyId: $companyId,
            payload: [
                'prediction_event_id' => $predictionEventId,
                'outcome_event_id' => $outcomeEventId,
                'predicted_action' => $predictedAction,
                'actual_action' => $actualAction,
                'matched' => $matched,
                'brier_score' => round($brier, 6),
            ],
            subjectType: $outcome->subjectType ?? $prediction->subjectType,
            subjectId: $outcome->subjectId ?? $prediction->subjectId,
            parentEventId: $predictionEventId,
            correlationId: $prediction->correlationId,
            privacyClass: $prediction->privacyClass,
            sequence: max($prediction->sequence, $outcome->sequence) + 1,
        );
        $this->store->append($score);
        return $score;
    }
}

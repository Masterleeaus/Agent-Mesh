<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Decision;

use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType;

final class DecisionRecorder
{
    public function __construct(private readonly CognitiveEventStoreInterface $store) {}

    public function recordRecommendation(string $companyId, ?string $proposedAction, float $confidence, array $scope = [], array $evidence = []): CognitiveEvent
    {
        return $this->record(CognitiveEventType::RecommendationCreated, $companyId, $proposedAction, $confidence, $scope, $evidence);
    }

    public function recordPrediction(string $companyId, string $proposedAction, float $confidence, ?string $correlationId = null, ?string $subjectType = null, ?string $subjectId = null, array $evidence = []): CognitiveEvent
    {
        return $this->record(CognitiveEventType::CandidateGenerated, $companyId, $proposedAction, $confidence, [
            'correlation_id' => $correlationId,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'prediction' => true,
        ], $evidence);
    }

    public function recordUserDecision(string $companyId, string $action, bool $approved, array $scope = []): CognitiveEvent
    {
        $type = $approved ? CognitiveEventType::UserApproved : CognitiveEventType::UserRejected;
        return $this->record($type, $companyId, $action, 1.0, $scope);
    }

    public function recordCorrection(string $companyId, string $action, array $correction, array $scope = []): CognitiveEvent
    {
        $scope['correction'] = $correction;
        $event = CognitiveEvent::create(
            type: CognitiveEventType::UserCorrected,
            companyId: $companyId,
            payload: ['proposed_action' => $action, 'correction' => $correction],
            userId: $scope['user_id'] ?? null,
            deviceId: $scope['device_id'] ?? null,
            teamId: $scope['team_id'] ?? null,
            subjectType: $scope['subject_type'] ?? null,
            subjectId: $scope['subject_id'] ?? null,
            parentEventId: $scope['parent_event_id'] ?? null,
            correlationId: $scope['correlation_id'] ?? null,
            privacyClass: $scope['privacy_class'] ?? 'company_private',
        );
        $this->store->append($event);
        return $event;
    }

    private function record(CognitiveEventType $type, string $companyId, ?string $action, float $confidence, array $scope, array $evidence = []): CognitiveEvent
    {
        $event = CognitiveEvent::create(
            type: $type,
            companyId: $companyId,
            payload: ['proposed_action' => $action, 'prediction' => (bool) ($scope['prediction'] ?? false)],
            userId: $scope['user_id'] ?? null,
            deviceId: $scope['device_id'] ?? null,
            teamId: $scope['team_id'] ?? null,
            subjectType: $scope['subject_type'] ?? null,
            subjectId: $scope['subject_id'] ?? null,
            interactionRunId: $scope['interaction_run_id'] ?? null,
            wizardRunId: $scope['wizard_run_id'] ?? null,
            confidence: $confidence,
            evidence: $evidence,
            policyDecision: $scope['policy_decision'] ?? null,
            modelVersion: $scope['model_version'] ?? null,
            parentEventId: $scope['parent_event_id'] ?? null,
            correlationId: $scope['correlation_id'] ?? null,
            privacyClass: $scope['privacy_class'] ?? 'company_private',
            sequence: (int) ($scope['sequence'] ?? 0),
        );
        $this->store->append($event);
        return $event;
    }
}

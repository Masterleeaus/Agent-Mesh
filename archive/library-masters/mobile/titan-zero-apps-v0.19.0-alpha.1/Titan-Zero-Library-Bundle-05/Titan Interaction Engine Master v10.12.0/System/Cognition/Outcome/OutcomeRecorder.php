<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Cognition\Outcome;

use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventStoreInterface;
use App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType;

final class OutcomeRecorder
{
    public function __construct(private readonly CognitiveEventStoreInterface $store) {}

    public function recordOutcome(string $companyId, array $outcome, ?string $correlationId = null, ?string $subjectType = null, ?string $subjectId = null, array $scope = []): CognitiveEvent
    {
        $event = CognitiveEvent::create(
            type: CognitiveEventType::OutcomeObserved,
            companyId: $companyId,
            payload: $outcome,
            userId: $scope['user_id'] ?? null,
            deviceId: $scope['device_id'] ?? null,
            teamId: $scope['team_id'] ?? null,
            subjectType: $subjectType,
            subjectId: $subjectId,
            parentEventId: $scope['parent_event_id'] ?? null,
            correlationId: $correlationId,
            privacyClass: $scope['privacy_class'] ?? 'company_private',
            sequence: (int) ($scope['sequence'] ?? 0),
        );
        $this->store->append($event);
        return $event;
    }
}

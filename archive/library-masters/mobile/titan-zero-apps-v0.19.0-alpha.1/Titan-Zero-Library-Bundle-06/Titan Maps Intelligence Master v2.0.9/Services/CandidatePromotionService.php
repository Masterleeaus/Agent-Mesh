<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\CandidateRepository;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateGateway;
use App\Extensions\TitanMapsIntelligence\Events\CandidatePromoted;
use App\Extensions\TitanMapsIntelligence\Events\CandidatePromotionFailed;
use App\Extensions\TitanMapsIntelligence\Events\CandidatePromotionRequested;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use Illuminate\Contracts\Events\Dispatcher;
use Throwable;

final class CandidatePromotionService
{
    private const ALLOWED_FIELDS = ['name', 'phone', 'website', 'public_email', 'address', 'categories'];
    private const ALLOWED_TARGETS = ['lead', 'customer', 'provider', 'contractor', 'supplier'];

    public function __construct(
        private readonly CandidateRepository $repository,
        private readonly PermissionAuthorizer $authorizer,
        private readonly WorkCoreCandidateGateway $workCore,
        private readonly AuditRecorder $audit,
        private readonly ?Dispatcher $events = null,
    ) {}

    public function promote(string $companyId, string $candidateId, string $targetType, array $acceptedFields, array $executionContext): array
    {
        $userId = (string) ($executionContext['user_id'] ?? '');
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.candidate.promote', ['candidate_id' => $candidateId, 'target_type' => $targetType]);

        if (! in_array($targetType, self::ALLOWED_TARGETS, true)) {
            throw MapsIntelligenceException::fromCode('MAPS_PROMOTION_VALIDATION_FAILED', 'The requested WorkCore target type is not supported.');
        }
        $candidate = $this->repository->findForCompany($companyId, $candidateId);
        if ($candidate === null) {
            throw MapsIntelligenceException::fromCode('MAPS_CANDIDATE_NOT_FOUND', 'The candidate does not exist in the authorised company scope.');
        }
        if (($candidate['review_status'] ?? $candidate['status'] ?? '') !== 'approved') {
            throw MapsIntelligenceException::fromCode('MAPS_CANDIDATE_APPROVAL_REQUIRED', 'Candidate promotion requires approval.');
        }
        if (($candidate['unresolved_match'] ?? false) === true) {
            throw MapsIntelligenceException::fromCode('MAPS_AMBIGUOUS_MATCH', 'Candidate has an unresolved WorkCore match.');
        }

        $fields = [];
        foreach (array_values(array_unique($acceptedFields)) as $field) {
            if (in_array($field, self::ALLOWED_FIELDS, true) && array_key_exists($field, $candidate)) {
                $fields[$field] = $candidate[$field];
            }
        }
        if ($fields === []) {
            throw MapsIntelligenceException::fromCode('MAPS_PROMOTION_VALIDATION_FAILED', 'No approved candidate fields were selected for promotion.');
        }

        $eventContext = [
            'user_id' => $userId,
            'agent_id' => $executionContext['agent_id'] ?? null,
            'conversation_id' => $executionContext['conversation_id'] ?? null,
            'correlation_id' => $executionContext['correlation_id'] ?? null,
            'branch_id' => $executionContext['branch_id'] ?? null,
            'workspace_id' => $executionContext['workspace_id'] ?? null,
            'reason' => $executionContext['reason'] ?? null,
        ];
        $this->events?->dispatch(new CandidatePromotionRequested($companyId, $eventContext['user_id'], $eventContext['agent_id'], $eventContext['conversation_id'], $eventContext['correlation_id'], null, ['candidate_id' => $candidateId, 'target_type' => $targetType, 'accepted_fields' => array_keys($fields)]));
        try {
            $result = $this->workCore->promote($companyId, $targetType, $fields, $executionContext + ['candidate_id' => $candidateId]);
        } catch (Throwable $exception) {
            $failure = [
                'type' => 'candidate.promotion_failed', 'company_id' => $companyId, 'candidate_id' => $candidateId,
                'target_type' => $targetType, 'requested_by_user_id' => $userId,
                'agent_id' => $eventContext['agent_id'], 'conversation_id' => $eventContext['conversation_id'],
                'correlation_id' => $eventContext['correlation_id'], 'failure_code' => 'MAPS_PROMOTION_FAILED',
                'exception_type' => $exception::class,
            ];
            $this->audit->record($failure);
            $this->events?->dispatch(new CandidatePromotionFailed($companyId, $eventContext['user_id'], $eventContext['agent_id'], $eventContext['conversation_id'], $eventContext['correlation_id'], null, ['candidate_id' => $candidateId, 'target_type' => $targetType, 'code' => 'MAPS_PROMOTION_FAILED']));
            throw MapsIntelligenceException::fromCode('MAPS_PROMOTION_FAILED', 'WorkCore could not promote the approved candidate.', ['candidate_id' => $candidateId, 'target_type' => $targetType], $exception);
        }
        $promotion = [
            'company_id' => $companyId,
            'candidate_id' => $candidateId,
            'target_type' => $targetType,
            'target_entity_id' => $result['entity_id'] ?? null,
            'accepted_fields' => array_keys($fields),
            'requested_by_user_id' => $userId,
            'agent_id' => $executionContext['agent_id'] ?? null,
            'conversation_id' => $executionContext['conversation_id'] ?? null,
            'correlation_id' => $executionContext['correlation_id'] ?? null,
            'branch_id' => $executionContext['branch_id'] ?? null,
            'workspace_id' => $executionContext['workspace_id'] ?? null,
            'reason' => $executionContext['reason'] ?? null,
            'workcore_command_id' => $result['command_id'] ?? null,
            'workcore_event_id' => $result['event_id'] ?? null,
        ];
        $this->repository->recordPromotion($promotion);
        $this->audit->record(['type' => 'candidate.promoted'] + $promotion);
        $this->events?->dispatch(new CandidatePromoted($companyId, $eventContext['user_id'], $eventContext['agent_id'], $eventContext['conversation_id'], $eventContext['correlation_id'], null, ['candidate_id' => $candidateId, 'target_type' => $targetType, 'target_entity_id' => $result['entity_id'] ?? null, 'workcore_event_id' => $result['event_id'] ?? null]));

        return $result;
    }
}

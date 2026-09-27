<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkCoreCandidateLookup;
use App\Extensions\TitanMapsIntelligence\Events\CandidateMatched;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;
use App\Extensions\TitanMapsIntelligence\Models\CandidateMatch;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use Illuminate\Contracts\Events\Dispatcher;

final class CandidateMatchWorkflow
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly WorkCoreCandidateLookup $lookup,
        private readonly CandidateMatchingService $matching,
        private readonly AuditRecorder $audit,
        private readonly Dispatcher $events,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function match(string $candidateId, string $entityType, string $entityId, array $execution = []): array
    {
        $companyId = $this->context->companyId();
        $userId = $this->context->userId();
        $this->authorizer->authorize($userId, $companyId, 'titan-maps-intelligence.candidate.read', ['candidate_id' => $candidateId]);
        $candidate = DiscoveryCandidate::query()->with('place')->where('company_id', $companyId)->whereKey($candidateId)->firstOrFail();
        $existing = $this->lookup->find($companyId, $entityType, $entityId);
        if ($existing === null) {
            throw MapsIntelligenceException::fromCode('MAPS_WORKCORE_ENTITY_NOT_FOUND', 'The requested WorkCore entity was not found in the authorised company.');
        }
        $result = $this->matching->score($candidate->place?->toArray() ?? [], $existing);
        $match = CandidateMatch::query()->create([
            'company_id' => $companyId, 'branch_id' => $this->context->branchId(), 'workspace_id' => $this->context->workspaceId(),
            'candidate_id' => $candidate->getKey(), 'workcore_entity_type' => $entityType, 'workcore_entity_id' => $entityId,
            'match_score' => $result->score, 'matching_fields' => $result->matchingFields, 'conflicting_fields' => $result->conflictingFields,
            'match_strategy' => 'deterministic_weighted:'.$this->configuration->version(), 'human_review_status' => $result->status === 'confirmed' ? 'confirmed' : 'pending',
        ]);
        $candidate->forceFill(['unresolved_match' => $result->status === 'ambiguous'])->save();
        $payload = ['configuration_version' => $this->configuration->version(), 'match_id' => $match->getKey(), 'candidate_id' => $candidate->getKey(), 'score' => $result->score, 'status' => $result->status, 'matching_fields' => $result->matchingFields, 'conflicting_fields' => $result->conflictingFields, 'breakdown' => $result->breakdown];
        $this->audit->record(['type' => 'candidate.matched', 'company_id' => $companyId, 'user_id' => $userId, 'agent_id' => $execution['agent_id'] ?? null, 'conversation_id' => $execution['conversation_id'] ?? null, 'entity_type' => 'discovery_candidate', 'entity_id' => $candidate->getKey(), 'after' => $payload]);
        $this->events->dispatch(new CandidateMatched($companyId, $userId, $execution['agent_id'] ?? null, $execution['conversation_id'] ?? null, $execution['correlation_id'] ?? null, null, $payload));
        return $payload;
    }
}

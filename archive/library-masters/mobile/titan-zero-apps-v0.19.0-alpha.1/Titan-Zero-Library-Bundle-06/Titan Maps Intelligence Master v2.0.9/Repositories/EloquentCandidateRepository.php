<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Repositories;

use App\Extensions\TitanMapsIntelligence\Contracts\CandidateRepository;
use App\Extensions\TitanMapsIntelligence\Models\CandidatePromotion;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Models\ExternalPlace;

final class EloquentCandidateRepository implements CandidateRepository
{
    public function findForCompany(string $companyId, string $candidateId): ?array
    {
        $candidate = DiscoveryCandidate::query()
            ->where('company_id', $companyId)
            ->whereKey($candidateId)
            ->first();
        if ($candidate === null) {
            return null;
        }

        $place = ExternalPlace::query()
            ->where('company_id', $companyId)
            ->whereKey($candidate->external_place_id)
            ->first();

        return array_merge($place?->toArray() ?? [], $candidate->toArray(), [
            'status' => $candidate->review_status,
            'candidate_id' => $candidate->getKey(),
        ]);
    }

    public function recordPromotion(array $promotion): void
    {
        CandidatePromotion::query()->create([
            'company_id' => $promotion['company_id'],
            'branch_id' => $promotion['branch_id'] ?? null,
            'workspace_id' => $promotion['workspace_id'] ?? null,
            'candidate_id' => $promotion['candidate_id'],
            'target_entity_type' => $promotion['target_type'],
            'target_entity_id' => $promotion['target_entity_id'] ?? null,
            'requested_by_user_id' => $promotion['requested_by_user_id'],
            'approved_by_user_id' => $promotion['approved_by_user_id'] ?? null,
            'agent_id' => $promotion['agent_id'] ?? null,
            'conversation_id' => $promotion['conversation_id'] ?? null,
            'accepted_fields' => $promotion['accepted_fields'],
            'rejected_fields' => $promotion['rejected_fields'] ?? [],
            'reason' => $promotion['reason'] ?? null,
            'workcore_command_id' => $promotion['workcore_command_id'] ?? null,
            'workcore_event_id' => $promotion['workcore_event_id'] ?? null,
            'promoted_at' => now(),
        ]);
    }
}

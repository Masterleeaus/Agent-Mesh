<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Events\CandidateApproved;
use App\Extensions\TitanMapsIntelligence\Events\CandidateClassified;
use App\Extensions\TitanMapsIntelligence\Events\CandidateRejected;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use Illuminate\Contracts\Events\Dispatcher;

final class CandidateReviewService
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly AuditRecorder $audit,
        private readonly Dispatcher $events,
        private readonly CandidateTypeValidator $types,
    ) {}

    public function classify(string $candidateId, string $candidateType, ?string $reason = null, array $execution = []): DiscoveryCandidate
    {
        $candidateType = $this->types->validate($candidateType);
        $record = $this->candidate($candidateId, 'titan-maps-intelligence.candidate.classify');
        $before = $record->only(['candidate_type', 'lifecycle_status', 'classification_evidence']);
        $record->forceFill([
            'candidate_type' => $candidateType,
            'lifecycle_status' => 'classified',
            'classification_evidence' => ['basis' => $execution['basis'] ?? 'human_confirmed', 'reason' => $reason],
        ])->save();
        $this->record('candidate.classified', $record, $before, $execution);
        $this->events->dispatch(new CandidateClassified($this->context->companyId(), $this->context->userId(), $execution['agent_id'] ?? null, $execution['conversation_id'] ?? null, $execution['correlation_id'] ?? null, null, ['candidate_id' => $record->getKey(), 'candidate_type' => $candidateType]));
        return $record->load('place');
    }

    public function approve(string $candidateId, array $execution = []): DiscoveryCandidate
    {
        $record = $this->candidate($candidateId, 'titan-maps-intelligence.candidate.approve');
        $before = $record->only(['review_status', 'lifecycle_status', 'approved_at']);
        $record->forceFill(['review_status' => 'approved', 'lifecycle_status' => 'approved', 'approved_at' => now(), 'rejected_at' => null, 'rejection_reason' => null])->save();
        $this->record('candidate.approved', $record, $before, $execution);
        $this->events->dispatch(new CandidateApproved($this->context->companyId(), $this->context->userId(), $execution['agent_id'] ?? null, $execution['conversation_id'] ?? null, $execution['correlation_id'] ?? null, null, ['candidate_id' => $record->getKey()]));
        return $record->load('place');
    }

    public function reject(string $candidateId, string $reason, array $execution = []): DiscoveryCandidate
    {
        $record = $this->candidate($candidateId, 'titan-maps-intelligence.candidate.reject');
        $before = $record->only(['review_status', 'lifecycle_status', 'rejected_at', 'rejection_reason']);
        $record->forceFill(['review_status' => 'rejected', 'lifecycle_status' => 'rejected', 'rejected_at' => now(), 'rejection_reason' => $reason])->save();
        $this->record('candidate.rejected', $record, $before, $execution);
        $this->events->dispatch(new CandidateRejected($this->context->companyId(), $this->context->userId(), $execution['agent_id'] ?? null, $execution['conversation_id'] ?? null, $execution['correlation_id'] ?? null, null, ['candidate_id' => $record->getKey(), 'reason' => $reason]));
        return $record->load('place');
    }

    private function candidate(string $id, string $permission): DiscoveryCandidate
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, $permission, ['candidate_id' => $id]);
        return DiscoveryCandidate::query()->where('company_id', $companyId)->whereKey($id)->firstOrFail();
    }

    private function record(string $type, DiscoveryCandidate $record, array $before, array $execution): void
    {
        $this->audit->record([
            'type' => $type, 'company_id' => $this->context->companyId(), 'user_id' => $this->context->userId(),
            'agent_id' => $execution['agent_id'] ?? null, 'conversation_id' => $execution['conversation_id'] ?? null,
            'correlation_id' => $execution['correlation_id'] ?? null, 'entity_type' => 'discovery_candidate',
            'entity_id' => $record->getKey(), 'before' => $before, 'after' => $record->toArray(),
        ]);
    }
}

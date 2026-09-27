<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\CandidateReviewService;

final class ClassifyCandidateTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly CandidateReviewService $reviews) {}
    public function execute(array $input): array
    {
        $this->authorizer->authorize($this->context->userId(), $this->context->companyId(), 'titan-maps-intelligence.candidate.classify');
        $candidate = $this->reviews->classify((string) ($input['candidate_id'] ?? ''), (string) ($input['candidate_type'] ?? 'unclassified'), $input['reason'] ?? null, ['basis' => 'agent_proposed', 'agent_id' => $input['agent_id'] ?? null, 'conversation_id' => $input['conversation_id'] ?? null]);
        return ['ok' => true, 'data' => ['candidate_id' => $candidate->getKey(), 'candidate_type' => $candidate->candidate_type]];
    }
}

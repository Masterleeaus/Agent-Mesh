<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;

final class ListCandidatesTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer) {}
    public function execute(array $input): array
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.candidate.read');
        $records = DiscoveryCandidate::query()->with('place')->where('company_id', $companyId)->where('discovery_search_id', (string) ($input['search_id'] ?? ''))->limit(min(100, max(1, (int) ($input['limit'] ?? 25))))->get();
        return ['ok' => true, 'data' => $records->map(static fn ($candidate): array => ['id' => $candidate->getKey(), 'candidate_type' => $candidate->candidate_type, 'review_status' => $candidate->review_status, 'confidence_score' => $candidate->confidence_score, 'place' => $candidate->place?->only(['id','name','primary_category','address','phone','website','rating','review_count','source_url'])])->all()];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Http\Requests\ClassifyCandidateRequest;
use App\Extensions\TitanMapsIntelligence\Http\Requests\MatchCandidateRequest;
use App\Extensions\TitanMapsIntelligence\Http\Requests\PromoteCandidateRequest;
use App\Extensions\TitanMapsIntelligence\Http\Requests\RejectCandidateRequest;
use App\Extensions\TitanMapsIntelligence\Http\Resources\CandidateResource;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;
use App\Extensions\TitanMapsIntelligence\Services\CandidateMatchWorkflow;
use App\Extensions\TitanMapsIntelligence\Services\CandidatePromotionService;
use App\Extensions\TitanMapsIntelligence\Services\CandidateReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CandidateController
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly CandidateReviewService $reviews,
        private readonly CandidateMatchWorkflow $matches,
        private readonly CandidatePromotionService $promotion,
    ) {}

    public function index(Request $request): mixed
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.candidate.read');
        $query = DiscoveryCandidate::query()->with('place')->where('company_id', $companyId);
        if ($request->filled('search_id')) { $query->where('discovery_search_id', (string) $request->query('search_id')); }
        return CandidateResource::collection($query->latest()->paginate(min(100, max(1, (int) $request->query('per_page', 25)))));
    }

    public function show(DiscoveryCandidate $mapsCandidate): CandidateResource
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.candidate.read', ['candidate_id' => $mapsCandidate->getKey()]);
        return new CandidateResource($mapsCandidate->load('place'));
    }

    public function classify(ClassifyCandidateRequest $request, DiscoveryCandidate $mapsCandidate): CandidateResource
    {
        return new CandidateResource($this->reviews->classify((string) $mapsCandidate->getKey(), (string) $request->validated('candidate_type'), $request->validated('reason')));
    }

    public function match(MatchCandidateRequest $request, DiscoveryCandidate $mapsCandidate): JsonResponse
    {
        $data = $request->validated();
        return response()->json(['ok' => true, 'data' => $this->matches->match((string) $mapsCandidate->getKey(), $data['workcore_entity_type'], $data['workcore_entity_id'])]);
    }

    public function approve(DiscoveryCandidate $mapsCandidate): CandidateResource
    {
        return new CandidateResource($this->reviews->approve((string) $mapsCandidate->getKey()));
    }

    public function reject(RejectCandidateRequest $request, DiscoveryCandidate $mapsCandidate): CandidateResource
    {
        return new CandidateResource($this->reviews->reject((string) $mapsCandidate->getKey(), (string) $request->validated('reason')));
    }

    public function promote(PromoteCandidateRequest $request, DiscoveryCandidate $mapsCandidate): JsonResponse
    {
        $data = $request->validated();
        $result = $this->promotion->promote($this->context->companyId(), (string) $mapsCandidate->getKey(), $data['target_type'], $data['accepted_fields'], [
            'user_id' => $this->context->userId(), 'branch_id' => $this->context->branchId(), 'workspace_id' => $this->context->workspaceId(),
            'agent_id' => $data['agent_id'] ?? null, 'conversation_id' => $data['conversation_id'] ?? null,
            'correlation_id' => $data['correlation_id'] ?? null, 'reason' => $data['reason'] ?? null,
        ]);
        return response()->json(['ok' => true, 'data' => $result]);
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Policies;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\DiscoveryCandidate;

final class DiscoveryCandidatePolicy
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer) {}
    public function view(mixed $user, DiscoveryCandidate $candidate): bool
    {
        if ($candidate->company_id !== $this->context->companyId()) { return false; }
        $this->authorizer->authorize($this->context->userId(), $this->context->companyId(), 'titan-maps-intelligence.candidate.read', ['candidate_id' => $candidate->getKey()]);
        return true;
    }
}

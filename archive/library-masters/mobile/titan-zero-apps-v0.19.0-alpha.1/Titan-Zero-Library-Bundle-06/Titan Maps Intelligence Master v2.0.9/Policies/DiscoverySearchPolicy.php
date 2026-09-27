<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Policies;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;

final class DiscoverySearchPolicy
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer) {}
    public function view(mixed $user, DiscoverySearch $search): bool
    {
        if ($search->company_id !== $this->context->companyId()) { return false; }
        $this->authorizer->authorize($this->context->userId(), $this->context->companyId(), 'titan-maps-intelligence.search.read', ['search_id' => $search->getKey()]);
        return true;
    }
}

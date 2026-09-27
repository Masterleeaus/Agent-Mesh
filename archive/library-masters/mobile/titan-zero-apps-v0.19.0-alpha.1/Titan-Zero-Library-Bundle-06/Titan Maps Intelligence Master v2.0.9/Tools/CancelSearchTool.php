<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\DiscoverySearchService;

final class CancelSearchTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer, private readonly DiscoverySearchService $searches) {}
    public function execute(array $input): array
    {
        $this->authorizer->authorize($this->context->userId(), $this->context->companyId(), 'titan-maps-intelligence.search.cancel');
        $id = (string) ($input['search_id'] ?? '');
        $this->searches->cancel($id);
        return ['ok' => true, 'data' => ['search_id' => $id, 'status' => 'cancelled']];
    }
}

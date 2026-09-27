<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;

final class ReadUsageTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer) {}
    public function execute(array $input): array
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.usage.read');
        $query = MapsUsageRecord::query()->where('company_id', $companyId);
        if (isset($input['search_id'])) { $query->where('discovery_search_id', (string) $input['search_id']); }
        $totals = $query->selectRaw('SUM(request_count) as request_count, SUM(result_count) as result_count, SUM(billable_units) as billable_units, SUM(estimated_cost) as estimated_cost')->first();
        return ['ok' => true, 'data' => ['request_count' => (int) ($totals->request_count ?? 0), 'result_count' => (int) ($totals->result_count ?? 0), 'billable_units' => (float) ($totals->billable_units ?? 0), 'estimated_cost' => (float) ($totals->estimated_cost ?? 0)]];
    }
}

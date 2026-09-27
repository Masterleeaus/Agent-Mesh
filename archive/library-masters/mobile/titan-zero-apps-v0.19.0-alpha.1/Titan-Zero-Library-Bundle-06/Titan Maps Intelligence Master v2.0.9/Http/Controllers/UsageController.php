<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Http\Resources\UsageResource;
use App\Extensions\TitanMapsIntelligence\Models\MapsUsageRecord;
use Illuminate\Http\Request;

final class UsageController
{
    public function __construct(private readonly AuthorisedCompanyContext $context, private readonly PermissionAuthorizer $authorizer) {}

    public function index(Request $request): mixed
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.usage.read');
        $query = MapsUsageRecord::query()->where('company_id', $companyId);
        if ($request->filled('search_id')) { $query->where('discovery_search_id', (string) $request->query('search_id')); }
        return UsageResource::collection($query->latest('recorded_at')->paginate(min(100, max(1, (int) $request->query('per_page', 25)))));
    }
}

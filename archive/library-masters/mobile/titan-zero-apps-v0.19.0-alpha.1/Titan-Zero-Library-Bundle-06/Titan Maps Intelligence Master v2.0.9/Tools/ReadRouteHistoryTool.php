<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\RouteSnapshot;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;
use App\Extensions\TitanMapsIntelligence\Services\RouteResultPresenter;

final class ReadRouteHistoryTool
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly MapsConfiguration $configuration,
        private readonly RouteResultPresenter $presenter,
    ) {}

    public function execute(array $input): array
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.route.read');
        $limit = min(max((int) ($input['limit'] ?? 20), 1), $this->configuration->routeHistoryLimit());
        $query=RouteSnapshot::query()->forCompany($companyId)->with('eta');
        if(isset($input['worker_public_id']) && trim((string)$input['worker_public_id'])!=='') $query->where('worker_public_id',(string)$input['worker_public_id']);
        if(isset($input['customer_public_id']) && trim((string)$input['customer_public_id'])!=='') $query->where('customer_public_id',(string)$input['customer_public_id']);
        if(isset($input['date_from']) && trim((string)$input['date_from'])!=='') $query->where('calculated_at','>=',(string)$input['date_from']);
        if(isset($input['date_to']) && trim((string)$input['date_to'])!=='') $query->where('calculated_at','<=',(string)$input['date_to']);
        $rows = $query->latest('created_at')->limit($limit)->get()->map(fn (RouteSnapshot $route): array => $this->presenter->snapshot($route))->values()->all();
        return ['ok' => true, 'data' => $rows];
    }
}

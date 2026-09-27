<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\RoutePlan;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;

final class ReadRoutePlansTool
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly MapsConfiguration $configuration,
    ) {}

    public function execute(array $input): array
    {
        $companyId=$this->context->companyId();
        $this->authorizer->authorize($this->context->userId(),$companyId,'titan-maps-intelligence.route-plan.read');
        $limit=min(max((int)($input['limit']??20),1),$this->configuration->routePlanHistoryLimit());
        $rows=RoutePlan::query()->forCompany($companyId)->with('currentRun')->latest('updated_at')->limit($limit)->get()->map(static fn(RoutePlan $plan):array=>[
            'id'=>(string)$plan->id,'name'=>(string)$plan->name,'service_date'=>$plan->service_date?->format('Y-m-d'),'worker_public_id'=>$plan->worker_public_id,
            'status'=>(string)$plan->status,'current_revision'=>$plan->currentRun?->revision,'basis'=>$plan->currentRun?->result_basis,
            'distance_savings_metres'=>$plan->currentRun?->distance_savings_metres,'duration_savings_seconds'=>$plan->currentRun?->duration_savings_seconds,
        ])->values()->all();
        return ['ok'=>true,'data'=>$rows];
    }
}

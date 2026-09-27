<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\ProviderCacheStore;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;

final class CheckServiceAreaTool
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly ServiceTerritoryService $territories,
        private readonly GovernedSpatialCapabilityExecutor $governance,
        private readonly ProviderCacheStore $cache,
    ) {}

    public function execute(array $input): array
    {
        $input['execution_origin'] = 'ai';
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.territory.evaluate');

        return $this->governance->execute('service_area.check', $input, function () use ($input, $companyId): array {
            $target = array_filter([
                'latitude'=>$input['latitude'] ?? null,
                'longitude'=>$input['longitude'] ?? null,
                'postcode'=>$input['postcode'] ?? null,
                'suburb'=>$input['suburb'] ?? null,
                'service_key'=>$input['service_key'] ?? null,
                'target_reference_type'=>$input['target_reference_type'] ?? null,
                'target_public_reference_id'=>$input['target_public_reference_id'] ?? null,
            ], static fn ($value): bool => $value !== null && $value !== '');
            $key = 'titan-maps:service-area-check:'.hash('sha256', $companyId.'|'.json_encode($target, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
            $cached = $this->cache->get($key);
            if (is_array($cached)) return $cached + ['cached'=>true];

            $evaluation = $this->territories->evaluate($target);
            $result = [
                'evaluation_id'=>(string)$evaluation->id,
                'inside_service_area'=>(bool)$evaluation->covered,
                'blocked_territory_id'=>$evaluation->blocked_territory_id,
                'primary_territory_id'=>$evaluation->primary_territory_id,
                'branch_public_id'=>$evaluation->branch_public_id,
                'road_distance_metres'=>$evaluation->road_distance_metres,
                'duration_seconds'=>$evaluation->duration_seconds,
                'distance_basis'=>$evaluation->distance_basis,
                'eta_basis'=>$evaluation->eta_basis,
                'matched_rule_chain'=>(array)($evaluation->evidence['matched_rule_chain'] ?? []),
                'pricing_signals'=>$evaluation->signals->map(static fn ($signal): array => [
                    'signal_type'=>$signal->signal_type,'severity'=>$signal->severity,'authoritative'=>(bool)$signal->authoritative,
                    'application_status'=>$signal->application_status,'hint_type'=>$signal->hint_type,'hint_value'=>$signal->hint_value,
                    'currency'=>$signal->currency,'evidence'=>$signal->evidence,
                ])->all(),
                'cached'=>false,
            ];
            $this->cache->put($key, $result, 5);
            return $result;
        });
    }
}

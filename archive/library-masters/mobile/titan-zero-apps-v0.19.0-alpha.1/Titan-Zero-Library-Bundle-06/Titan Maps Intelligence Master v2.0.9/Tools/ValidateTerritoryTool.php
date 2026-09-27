<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
use App\Extensions\TitanMapsIntelligence\Services\ProviderCacheStore;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;

final class ValidateTerritoryTool
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

        return $this->governance->execute('territory.validate', $input, function () use ($input, $companyId): array {
            $target = array_filter([
                'latitude'=>$input['latitude'] ?? null,
                'longitude'=>$input['longitude'] ?? null,
                'postcode'=>$input['postcode'] ?? null,
                'suburb'=>$input['suburb'] ?? null,
                'service_key'=>$input['service_key'] ?? null,
            ], static fn ($value): bool => $value !== null && $value !== '');
            $key = 'titan-maps:territory-validate:'.hash('sha256', $companyId.'|'.json_encode($target, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
            $cached = $this->cache->get($key);
            if (is_array($cached)) return $cached + ['cached'=>true];

            $evaluation = $this->territories->evaluate($target);
            $result = [
                'valid'=>(bool)$evaluation->covered,
                'covered'=>(bool)$evaluation->covered,
                'evaluation_id'=>(string)$evaluation->id,
                'blocked_territory_id'=>$evaluation->blocked_territory_id,
                'primary_territory_id'=>$evaluation->primary_territory_id,
                'matched_rule_chain'=>(array)($evaluation->evidence['matched_rule_chain'] ?? []),
                'reason_codes'=>$evaluation->covered ? ['SERVICE_AREA_VALID'] : [$evaluation->blocked_territory_id ? 'SERVICE_AREA_EXCLUDED' : 'OUTSIDE_SERVICE_AREA'],
                'cached'=>false,
            ];
            $this->cache->put($key, $result, 5);
            return $result;
        });
    }
}

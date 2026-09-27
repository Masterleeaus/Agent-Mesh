<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\Services\DiscoverySearchService;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;

final class SearchBusinessesTool
{
    public function __construct(
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
        private readonly DiscoverySearchService $searches,
        private readonly MapsConfiguration $configuration,
    ) {}
    public function execute(array $input): array
    {
        $companyId = $this->context->companyId();
        $this->authorizer->authorize($this->context->userId(), $companyId, 'titan-maps-intelligence.search.create');
        $coordinates = isset($input['latitude'], $input['longitude']) ? new Coordinates((float) $input['latitude'], (float) $input['longitude']) : null;
        $maximumResults = (int) ($input['maximum_results'] ?? min(20, $this->configuration->maximumResults()));
        $radiusMetres = isset($input['radius_metres']) ? (float) $input['radius_metres'] : null;
        $this->configuration->assertSearchLimits($maximumResults, $radiusMetres);
        $search = $this->searches->create(new PlaceSearchRequest(
            query: (string) ($input['query'] ?? ''), maximumResults: $maximumResults,
            languageCode: (string) ($input['language'] ?? 'en'), regionCode: $input['country'] ?? null,
            locationBias: $coordinates, radiusMetres: $radiusMetres,
            includedType: $input['category'] ?? null, openNow: (bool) ($input['open_now'] ?? false),
            minimumRating: isset($input['minimum_rating']) ? (float) $input['minimum_rating'] : null,
        ), ['purpose' => $input['purpose'] ?? 'provider_discovery', 'conversation_id' => $input['conversation_id'] ?? null, 'agent_id' => $input['agent_id'] ?? null, 'correlation_id' => $input['correlation_id'] ?? null]);
        return ['ok' => true, 'data' => ['search_id' => $search->getKey(), 'status' => $search->status]];
    }
}

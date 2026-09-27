<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\Http\Requests\StoreSearchRequest;
use App\Extensions\TitanMapsIntelligence\Http\Resources\SearchResource;
use App\Extensions\TitanMapsIntelligence\Models\DiscoverySearch;
use App\Extensions\TitanMapsIntelligence\Services\DiscoverySearchService;
use Illuminate\Http\JsonResponse;

final class SearchController
{
    public function __construct(
        private readonly DiscoverySearchService $searches,
        private readonly AuthorisedCompanyContext $context,
        private readonly PermissionAuthorizer $authorizer,
    ) {}

    public function store(StoreSearchRequest $request): SearchResource
    {
        $data = $request->validated();
        $coordinates = isset($data['latitude'], $data['longitude']) ? new Coordinates((float) $data['latitude'], (float) $data['longitude']) : null;
        $search = $this->searches->create(new PlaceSearchRequest(
            query: $data['query'], maximumResults: (int) ($data['maximum_results'] ?? 20),
            languageCode: (string) ($data['language'] ?? 'en'), regionCode: $data['country'] ?? null,
            locationBias: $coordinates, radiusMetres: isset($data['radius_metres']) ? (float) $data['radius_metres'] : null,
            includedType: $data['category'] ?? null, openNow: (bool) ($data['open_now'] ?? false),
            minimumRating: isset($data['minimum_rating']) ? (float) $data['minimum_rating'] : null,
        ), [
            'purpose' => $data['purpose'], 'conversation_id' => $data['conversation_id'] ?? null,
            'provider_strategy' => isset($data['provider']) ? ['provider' => $data['provider']] : [],
        ]);
        return new SearchResource($search);
    }

    public function show(DiscoverySearch $mapsSearch): SearchResource
    {
        return new SearchResource($this->searches->find((string) $mapsSearch->getKey()) ?? abort(404));
    }

    public function cancel(DiscoverySearch $mapsSearch): JsonResponse
    {
        $searchId = (string) $mapsSearch->getKey();
        $this->searches->cancel($searchId);
        return response()->json(['ok' => true, 'data' => ['search_id' => $searchId, 'status' => 'cancelled']]);
    }
}

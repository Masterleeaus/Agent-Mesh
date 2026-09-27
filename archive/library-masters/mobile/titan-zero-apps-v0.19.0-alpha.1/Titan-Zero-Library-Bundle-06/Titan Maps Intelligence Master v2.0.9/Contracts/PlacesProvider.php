<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\ExternalPlaceData;
use App\Extensions\TitanMapsIntelligence\DTO\NearbySearchRequest;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchPage;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderCapabilities;

interface PlacesProvider
{
    public function id(): string;
    public function capabilities(): ProviderCapabilities;
    public function attribution(): string;
    public function search(PlaceSearchRequest $request): PlaceSearchPage;
    public function nearby(NearbySearchRequest $request): PlaceSearchPage;
    public function details(string $providerPlaceId): ExternalPlaceData;
}

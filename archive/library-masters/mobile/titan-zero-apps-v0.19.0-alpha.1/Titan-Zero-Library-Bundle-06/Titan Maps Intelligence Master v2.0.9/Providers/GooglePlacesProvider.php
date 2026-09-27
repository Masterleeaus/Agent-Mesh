<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Providers;

use App\Extensions\TitanMapsIntelligence\Contracts\PlacesProvider;
use App\Extensions\TitanMapsIntelligence\Contracts\ProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Contracts\SecretResolver;
use App\Extensions\TitanMapsIntelligence\DTO\ExternalPlaceData;
use App\Extensions\TitanMapsIntelligence\DTO\NearbySearchRequest;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchPage;
use App\Extensions\TitanMapsIntelligence\DTO\PlaceSearchRequest;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderCapabilities;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Support\GooglePlacesNormalizer;

final class GooglePlacesProvider implements PlacesProvider
{
    private const ALLOWED_BASE_URI = 'https://places.googleapis.com';

    public function __construct(
        private readonly ProviderHttpTransport $transport,
        private readonly SecretResolver $secrets,
        private readonly array $config,
        private readonly GooglePlacesNormalizer $normalizer = new GooglePlacesNormalizer(),
    ) {
        $baseUri = rtrim((string) ($config['base_uri'] ?? self::ALLOWED_BASE_URI), '/');
        if ($baseUri !== self::ALLOWED_BASE_URI) {
            throw ProviderException::fromCode('MAPS_PROVIDER_HOST_DENIED', 'The configured Google Places host is not allowlisted.');
        }
        if (str_contains((string) ($config['field_masks']['search'] ?? ''), '*') || str_contains((string) ($config['field_masks']['details'] ?? ''), '*')) {
            throw ProviderException::fromCode('MAPS_PROVIDER_FIELD_MASK_INVALID', 'Wildcard field masks are prohibited in production configuration.');
        }
    }

    public function id(): string { return 'google-places'; }

    public function capabilities(): ProviderCapabilities
    {
        return new ProviderCapabilities(true, true, true, true, ['language', 'region', 'type', 'open_now', 'minimum_rating', 'location_bias'], ['provider terms apply']);
    }

    public function attribution(): string { return 'Google Maps'; }

    public function search(PlaceSearchRequest $request): PlaceSearchPage
    {
        $json = [
            'textQuery' => $request->query,
            'pageSize' => min((int) $this->config['page_size'], $request->maximumResults),
            'languageCode' => $request->languageCode,
        ];
        if ($request->regionCode !== null) { $json['regionCode'] = $request->regionCode; }
        if ($request->includedType !== null) { $json['includedType'] = $request->includedType; $json['strictTypeFiltering'] = true; }
        if ($request->openNow) { $json['openNow'] = true; }
        if ($request->minimumRating !== null) { $json['minRating'] = $request->minimumRating; }
        if ($request->pageToken !== null) { $json['pageToken'] = $request->pageToken; }
        if ($request->locationBias !== null && $request->radiusMetres !== null) {
            $json['locationBias'] = ['circle' => ['center' => $request->locationBias->toArray(), 'radius' => $request->radiusMetres]];
        }

        $response = $this->call('POST', '/v1/places:searchText', $this->searchMask(), $json);
        return $this->pageFromResponse($response, 'text_search');
    }

    public function nearby(NearbySearchRequest $request): PlaceSearchPage
    {
        $json = [
            'maxResultCount' => min((int) $this->config['page_size'], $request->maximumResults),
            'locationRestriction' => ['circle' => ['center' => $request->center->toArray(), 'radius' => $request->radiusMetres]],
            'languageCode' => $request->languageCode,
            'rankPreference' => $request->rankPreference,
        ];
        if ($request->includedTypes !== []) { $json['includedTypes'] = array_values($request->includedTypes); }
        if ($request->regionCode !== null) { $json['regionCode'] = $request->regionCode; }

        $response = $this->call('POST', '/v1/places:searchNearby', $this->searchMask(), $json);
        return $this->pageFromResponse($response, 'nearby_search');
    }

    public function details(string $providerPlaceId): ExternalPlaceData
    {
        $id = rawurlencode(trim($providerPlaceId));
        if ($id === '') {
            throw ProviderException::fromCode('MAPS_INVALID_PLACE_ID', 'A provider place ID is required.');
        }
        $response = $this->call('GET', '/v1/places/'.$id, $this->detailsMask());
        return $this->normalizer->normalize($response);
    }

    private function call(string $method, string $path, string $fieldMask, array $json = []): array
    {
        $this->assertCredentialCostOwnership();
        $reference = (string) ($this->config['credential_reference'] ?? '');
        if ($reference === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'Google Places credential reference is not configured.');
        }
        $apiKey = $this->secrets->resolve($reference);
        if ($apiKey === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_AUTH_FAILED', 'The Google Places credential could not be resolved.');
        }

        return $this->transport->request(
            $method,
            self::ALLOWED_BASE_URI.$path,
            [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'X-Goog-Api-Key' => $apiKey,
                'X-Goog-FieldMask' => $fieldMask,
            ],
            $json,
            max(1, min(30, (int) ($this->config['timeout_seconds'] ?? 10))),
            max(0, min(3, (int) ($this->config['retry_attempts'] ?? 2))),
        );
    }

    private function pageFromResponse(array $response, string $operation): PlaceSearchPage
    {
        $places = array_map(fn (array $place): ExternalPlaceData => $this->normalizer->normalize($place), array_values((array) ($response['places'] ?? [])));
        return new PlaceSearchPage(
            $places,
            isset($response['nextPageToken']) ? (string) $response['nextPageToken'] : null,
            new ProviderUsage($this->id(), $operation, 1, count($places), 1.0),
        );
    }

    private function searchMask(): string
    {
        $mask = trim((string) ($this->config['field_masks']['search'] ?? ''));
        if ($mask === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_FIELD_MASK_INVALID', 'A Google search field mask is required.');
        }
        return $mask;
    }

    private function detailsMask(): string
    {
        $mask = trim((string) ($this->config['field_masks']['details'] ?? ''));
        if ($mask === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_FIELD_MASK_INVALID', 'A Google details field mask is required.');
        }
        return $mask;
    }

    private function assertCredentialCostOwnership(): void
    {
        $owner = strtolower(trim((string) ($this->config['credential_cost_owner'] ?? 'customer')));
        if ($owner !== 'titan') return;
        $companyId = (int) ($this->config['company_id'] ?? 0);
        $entitlement = (string) ($this->config['managed_entitlement'] ?? 'titan.maps.managed');
        if ($companyId <= 0 || ! app()->bound('titan.workforce.entitlements')) {
            throw ProviderException::fromCode('MAPS_MANAGED_ENTITLEMENT_REQUIRED', 'Titan-managed maps require an explicit company entitlement context.');
        }
        $service = app('titan.workforce.entitlements');
        if (! method_exists($service, 'has') || ! $service->has($companyId, $entitlement)) {
            throw ProviderException::fromCode('MAPS_MANAGED_ENTITLEMENT_REQUIRED', 'Titan-managed maps are not entitled for this company.');
        }
    }

}

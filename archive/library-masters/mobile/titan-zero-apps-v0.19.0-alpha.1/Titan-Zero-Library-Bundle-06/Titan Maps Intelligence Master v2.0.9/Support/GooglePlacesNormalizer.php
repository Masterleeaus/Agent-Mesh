<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Support;

use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\ExternalPlaceData;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;

final class GooglePlacesNormalizer
{
    public function normalize(array $place): ExternalPlaceData
    {
        $providerPlaceId = trim((string) ($place['id'] ?? ''));
        $name = trim((string) ($place['displayName']['text'] ?? ''));
        if ($providerPlaceId === '' || $name === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_INVALID_RESPONSE', 'The places provider response omitted a required place identity field.');
        }

        $location = isset($place['location']['latitude'], $place['location']['longitude'])
            ? new Coordinates((float) $place['location']['latitude'], (float) $place['location']['longitude'])
            : null;

        return new ExternalPlaceData(
            provider: 'google-places',
            providerPlaceId: $providerPlaceId,
            name: $name,
            address: isset($place['formattedAddress']) ? (string) $place['formattedAddress'] : null,
            coordinates: $location,
            phone: isset($place['internationalPhoneNumber'])
                ? (string) $place['internationalPhoneNumber']
                : (isset($place['nationalPhoneNumber']) ? (string) $place['nationalPhoneNumber'] : null),
            website: isset($place['websiteUri']) ? (string) $place['websiteUri'] : null,
            categories: array_values(array_filter((array) ($place['types'] ?? []), 'is_string')),
            primaryCategory: isset($place['primaryType']) ? (string) $place['primaryType'] : null,
            rating: isset($place['rating']) ? (float) $place['rating'] : null,
            reviewCount: isset($place['userRatingCount']) ? (int) $place['userRatingCount'] : null,
            businessStatus: isset($place['businessStatus']) ? (string) $place['businessStatus'] : null,
            currentlyOpen: isset($place['currentOpeningHours']['openNow']) ? (bool) $place['currentOpeningHours']['openNow'] : null,
            openingHours: (array) ($place['regularOpeningHours']['weekdayDescriptions'] ?? []),
            sourceUrl: isset($place['googleMapsUri']) ? (string) $place['googleMapsUri'] : null,
            attributions: (array) ($place['attributions'] ?? []),
            providerMetadata: [
                'pure_service_area_business' => $place['pureServiceAreaBusiness'] ?? null,
                'primary_type_display_name' => $place['primaryTypeDisplayName']['text'] ?? null,
            ],
        );
    }
}

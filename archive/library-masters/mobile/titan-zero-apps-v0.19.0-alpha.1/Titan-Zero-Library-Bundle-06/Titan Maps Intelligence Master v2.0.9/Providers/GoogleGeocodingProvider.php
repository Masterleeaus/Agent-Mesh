<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Providers;

use App\Extensions\TitanMapsIntelligence\Contracts\GeocodingProvider;
use App\Extensions\TitanMapsIntelligence\Contracts\ProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Contracts\SecretResolver;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeResult;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\DTO\ReverseGeocodeRequest;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;

final class GoogleGeocodingProvider implements GeocodingProvider
{
    private const ALLOWED_BASE_URI = 'https://geocode.googleapis.com';

    public function __construct(
        private readonly ProviderHttpTransport $transport,
        private readonly SecretResolver $secrets,
        private readonly array $config,
    ) {
        if (rtrim((string) ($config['base_uri'] ?? ''), '/') !== self::ALLOWED_BASE_URI) {
            throw ProviderException::fromCode('MAPS_PROVIDER_HOST_DENIED', 'The configured Google Geocoding host is not allowlisted.');
        }
        foreach (['forward', 'reverse'] as $name) {
            $mask = (string) ($config['field_masks'][$name] ?? '');
            if ($mask === '' || str_contains($mask, '*')) {
                throw ProviderException::fromCode('MAPS_PROVIDER_FIELD_MASK_INVALID', 'Google Geocoding field masks must be explicit.');
            }
        }
    }

    public function id(): string { return 'google-geocoding'; }

    public function geocode(GeocodeRequest $request): GeocodeResult
    {
        $path = '/v4/geocode/address/'.rawurlencode(trim($request->address));
        $response = $this->call($path, $this->config['field_masks']['forward'], $this->query($request->languageCode, $request->regionCode));
        return $this->normalize($response, 'geocode_forward');
    }

    public function reverseGeocode(ReverseGeocodeRequest $request): GeocodeResult
    {
        $coordinates = $request->coordinates;
        $path = '/v4/geocode/location/'.rawurlencode($coordinates->latitude.','.$coordinates->longitude);
        $response = $this->call($path, $this->config['field_masks']['reverse'], $this->query($request->languageCode, $request->regionCode));
        return $this->normalize($response, 'geocode_reverse');
    }

    private function call(string $path, string $fieldMask, array $query): array
    {
        $reference = trim((string) ($this->config['credential_reference'] ?? ''));
        if ($reference === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'Google Geocoding credential reference is not configured.');
        }
        $apiKey = $this->secrets->resolve($reference);
        if ($apiKey === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_AUTH_FAILED', 'The Google Geocoding credential could not be resolved.');
        }
        $url = self::ALLOWED_BASE_URI.$path.($query === [] ? '' : '?'.http_build_query($query, '', '&', PHP_QUERY_RFC3986));
        return $this->transport->request('GET', $url, [
            'Accept' => 'application/json',
            'X-Goog-Api-Key' => $apiKey,
            'X-Goog-FieldMask' => $fieldMask,
        ], [], (int) $this->config['timeout_seconds'], (int) $this->config['retry_attempts']);
    }

    private function normalize(array $response, string $operation): GeocodeResult
    {
        $result = (array) (($response['results'] ?? [])[0] ?? []);
        $location = (array) ($result['location'] ?? []);
        if (! isset($location['latitude'], $location['longitude'])) {
            throw ProviderException::fromCode('MAPS_GEOCODE_NOT_FOUND', 'Google Geocoding returned no usable location.');
        }
        return new GeocodeResult(
            $this->id(),
            new Coordinates((float) $location['latitude'], (float) $location['longitude']),
            (string) ($result['formattedAddress'] ?? ''),
            isset($result['placeId']) ? (string) $result['placeId'] : null,
            isset($result['granularity']) ? (string) $result['granularity'] : null,
            array_values((array) ($result['addressComponents'] ?? [])),
            new ProviderUsage($this->id(), $operation, 1, 1, 1.0),
        );
    }

    private function query(?string $languageCode, ?string $regionCode): array
    {
        $query = [];
        if ($languageCode !== null && trim($languageCode) !== '') { $query['languageCode'] = trim($languageCode); }
        if ($regionCode !== null && trim($regionCode) !== '') { $query['regionCode'] = trim($regionCode); }
        return $query;
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Providers;

use App\Extensions\TitanMapsIntelligence\Contracts\ProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Contracts\RoutingProvider;
use App\Extensions\TitanMapsIntelligence\Contracts\SecretResolver;
use App\Extensions\TitanMapsIntelligence\Contracts\TrafficProvider;
use App\Extensions\TitanMapsIntelligence\DTO\ProviderUsage;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixElement;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixResult;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteResult;
use App\Extensions\TitanMapsIntelligence\DTO\TrafficEstimate;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use App\Extensions\TitanMapsIntelligence\Support\GoogleDurationParser;

final class GoogleRoutesProvider implements RoutingProvider, TrafficProvider
{
    private const ALLOWED_BASE_URI = 'https://routes.googleapis.com';

    public function __construct(
        private readonly ProviderHttpTransport $transport,
        private readonly SecretResolver $secrets,
        private readonly array $config,
        private readonly GoogleDurationParser $durationParser = new GoogleDurationParser(),
    ) {
        if (rtrim((string) ($config['base_uri'] ?? ''), '/') !== self::ALLOWED_BASE_URI) {
            throw ProviderException::fromCode('MAPS_PROVIDER_HOST_DENIED', 'The configured Google Routes host is not allowlisted.');
        }
        foreach (['route', 'matrix'] as $name) {
            $mask = (string) ($config['field_masks'][$name] ?? '');
            if ($mask === '' || str_contains($mask, '*')) {
                throw ProviderException::fromCode('MAPS_PROVIDER_FIELD_MASK_INVALID', 'Google Routes field masks must be explicit.');
            }
        }
    }

    public function id(): string { return 'google-routes'; }

    public function route(RouteRequest $request): RouteResult
    {
        $payload = [
            'origin' => $this->waypoint($request->origin->toArray()),
            'destination' => $this->waypoint($request->destination->toArray()),
            'travelMode' => $request->travelMode,
            'routingPreference' => $request->routingPreference,
            'computeAlternativeRoutes' => false,
        ];
        if ($request->departureTime !== null) { $payload['departureTime'] = $request->departureTime; }
        if ($request->languageCode !== null) { $payload['languageCode'] = $request->languageCode; }

        $response = $this->call('/directions/v2:computeRoutes', $this->config['field_masks']['route'], $payload);
        $route = (array) (($response['routes'] ?? [])[0] ?? []);
        if (! isset($route['distanceMeters'], $route['duration'])) {
            throw ProviderException::fromCode('MAPS_ROUTE_NOT_FOUND', 'Google Routes returned no usable route.');
        }

        return new RouteResult(
            $this->id(),
            (int) $route['distanceMeters'],
            (int) $this->durationParser->seconds((string) $route['duration']),
            $this->durationParser->seconds(isset($route['staticDuration']) ? (string) $route['staticDuration'] : null),
            $request->isTrafficAware(),
            isset($route['polyline']['encodedPolyline']) ? (string) $route['polyline']['encodedPolyline'] : null,
            new ProviderUsage($this->id(), 'compute_route', 1, 1, 1.0),
        );
    }

    public function matrix(RouteMatrixRequest $request): RouteMatrixResult
    {
        if ($request->elementCount() > 625 || (($request->routingPreference === 'TRAFFIC_AWARE_OPTIMAL' || $request->travelMode === 'TRANSIT') && $request->elementCount() > 100)) {
            throw ProviderException::fromCode('MAPS_ROUTE_MATRIX_LIMIT_EXCEEDED', 'The route matrix exceeds Google Routes element limits.', [
                'elements' => $request->elementCount(),
                'routing_preference' => $request->routingPreference,
                'travel_mode' => $request->travelMode,
            ]);
        }

        $payload = [
            'origins' => array_map(fn ($c): array => ['waypoint' => $this->waypoint($c->toArray())], $request->origins),
            'destinations' => array_map(fn ($c): array => ['waypoint' => $this->waypoint($c->toArray())], $request->destinations),
            'travelMode' => $request->travelMode,
            'routingPreference' => $request->routingPreference,
        ];
        if ($request->departureTime !== null) { $payload['departureTime'] = $request->departureTime; }

        $response = $this->call('/distanceMatrix/v2:computeRouteMatrix', $this->config['field_masks']['matrix'], $payload);
        $elements = [];
        foreach (array_values($response) as $item) {
            if (! is_array($item)) { continue; }
            $elements[] = new RouteMatrixElement(
                (int) ($item['originIndex'] ?? 0),
                (int) ($item['destinationIndex'] ?? 0),
                isset($item['distanceMeters']) ? (int) $item['distanceMeters'] : null,
                $this->durationParser->seconds(isset($item['duration']) ? (string) $item['duration'] : null),
                $this->durationParser->seconds(isset($item['staticDuration']) ? (string) $item['staticDuration'] : null),
                (string) ($item['condition'] ?? (($item['status']['code'] ?? null) === 0 ? 'ROUTE_EXISTS' : 'ROUTE_NOT_FOUND')),
            );
        }

        return new RouteMatrixResult(
            $this->id(),
            $elements,
            $request->isTrafficAware(),
            new ProviderUsage($this->id(), 'compute_route_matrix', 1, count($elements), (float) $request->elementCount()),
        );
    }

    public function traffic(RouteRequest $request): TrafficEstimate
    {
        $trafficRequest = $request->isTrafficAware() ? $request : new RouteRequest(
            $request->origin,
            $request->destination,
            $request->travelMode,
            'TRAFFIC_AWARE',
            $request->departureTime,
            $request->languageCode,
        );
        $route = $this->route($trafficRequest);

        return new TrafficEstimate(
            $this->id(),
            $route->durationSeconds,
            $route->staticDurationSeconds,
            $route->trafficDelaySeconds(),
            'traffic_aware',
            $route->usage,
        );
    }

    private function call(string $path, string $fieldMask, array $payload): array
    {
        $reference = trim((string) ($this->config['credential_reference'] ?? ''));
        if ($reference === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'Google Routes credential reference is not configured.');
        }
        $apiKey = $this->secrets->resolve($reference);
        if ($apiKey === '') {
            throw ProviderException::fromCode('MAPS_PROVIDER_AUTH_FAILED', 'The Google Routes credential could not be resolved.');
        }

        return $this->transport->request('POST', self::ALLOWED_BASE_URI.$path, [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'X-Goog-Api-Key' => $apiKey,
            'X-Goog-FieldMask' => $fieldMask,
        ], $payload, (int) $this->config['timeout_seconds'], (int) $this->config['retry_attempts']);
    }

    private function waypoint(array $coordinates): array
    {
        return ['location' => ['latLng' => $coordinates]];
    }
}

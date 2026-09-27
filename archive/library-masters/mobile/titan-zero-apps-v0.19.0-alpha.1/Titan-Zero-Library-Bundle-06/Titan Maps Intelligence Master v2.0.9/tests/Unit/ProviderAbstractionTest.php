<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanMapsIntelligence;

use App\Extensions\TitanMapsIntelligence\Contracts\ProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Contracts\SecretResolver;
use App\Extensions\TitanMapsIntelligence\DTO\Coordinates;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteMatrixRequest;
use App\Extensions\TitanMapsIntelligence\DTO\RouteRequest;
use App\Extensions\TitanMapsIntelligence\Providers\GeocodingProviderRegistry;
use App\Extensions\TitanMapsIntelligence\Providers\GoogleGeocodingProvider;
use App\Extensions\TitanMapsIntelligence\Providers\GoogleRoutesProvider;
use App\Extensions\TitanMapsIntelligence\Providers\RoutingProviderRegistry;
use PHPUnit\Framework\TestCase;
use Tests\Fakes\TitanMapsIntelligence\FakeGeocodingProvider;
use Tests\Fakes\TitanMapsIntelligence\FakeRoutingProvider;

final class ProviderAbstractionTest extends TestCase
{
    public function test_fake_providers_can_replace_google_without_domain_changes(): void
    {
        $geocoding = new GeocodingProviderRegistry();
        $geocoding->register(new FakeGeocodingProvider());
        self::assertSame(-37.8136, $geocoding->get('fake-geocoding')->geocode(new GeocodeRequest('Melbourne'))->coordinates->latitude);

        $routing = new RoutingProviderRegistry();
        $routing->register(new FakeRoutingProvider());
        $result = $routing->get('fake-routing')->route(new RouteRequest(new Coordinates(-37.81, 144.96), new Coordinates(-37.82, 145.00)));
        self::assertSame(4200, $result->distanceMetres);
        self::assertSame(120, $result->trafficDelaySeconds());
    }

    public function test_google_geocoding_v4_normalises_a_forward_result(): void
    {
        $transport = new CapturingTransport([[
            'results' => [[
                'placeId' => 'abc',
                'location' => ['latitude' => -37.8136, 'longitude' => 144.9631],
                'granularity' => 'ROOFTOP',
                'formattedAddress' => 'Melbourne VIC, Australia',
                'addressComponents' => [],
            ]],
        ]]);
        $provider = new GoogleGeocodingProvider($transport, new FixedSecretResolver(), array_replace($this->config()['providers']['google-geocoding'], ['credential_reference' => 'vault://google']));
        $result = $provider->geocode(new GeocodeRequest('Melbourne VIC', 'en', 'AU'));

        self::assertSame('abc', $result->providerPlaceId);
        self::assertStringStartsWith('https://geocode.googleapis.com/v4/geocode/address/', $transport->calls[0]['url']);
        self::assertSame('test-key', $transport->calls[0]['headers']['X-Goog-Api-Key']);
        self::assertStringContainsString('results.location', $transport->calls[0]['headers']['X-Goog-FieldMask']);
    }

    public function test_google_routes_normalises_traffic_route_and_matrix_usage(): void
    {
        $transport = new CapturingTransport([
            ['routes' => [[
                'distanceMeters' => 9200,
                'duration' => '1200.4s',
                'staticDuration' => '900s',
                'polyline' => ['encodedPolyline' => 'abc'],
            ]]],
            [
                ['originIndex' => 0, 'destinationIndex' => 0, 'condition' => 'ROUTE_EXISTS', 'distanceMeters' => 9200, 'duration' => '1200s', 'staticDuration' => '900s'],
                ['originIndex' => 0, 'destinationIndex' => 1, 'condition' => 'ROUTE_EXISTS', 'distanceMeters' => 14000, 'duration' => '1800s', 'staticDuration' => '1500s'],
            ],
        ]);
        $provider = new GoogleRoutesProvider($transport, new FixedSecretResolver(), array_replace($this->config()['providers']['google-routes'], ['credential_reference' => 'vault://google']));
        $origin = new Coordinates(-37.81, 144.96);
        $destination = new Coordinates(-37.82, 145.00);

        $route = $provider->route(new RouteRequest($origin, $destination));
        self::assertSame(1200, $route->durationSeconds);
        self::assertSame(300, $route->trafficDelaySeconds());
        self::assertSame('TRAFFIC_AWARE', $transport->calls[0]['json']['routingPreference']);

        $matrix = $provider->matrix(new RouteMatrixRequest([$origin], [$destination, new Coordinates(-37.84, 145.03)]));
        self::assertCount(2, $matrix->elements);
        self::assertSame(2.0, $matrix->usage->billableUnits);
        self::assertSame('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', $transport->calls[1]['url']);
    }

    private function config(): array { return require dirname(__DIR__, 2).'/config/titan_maps_intelligence.php'; }
}

final class FixedSecretResolver implements SecretResolver
{
    public function resolve(string $credentialReference): string { return 'test-key'; }
}

final class CapturingTransport implements ProviderHttpTransport
{
    public array $calls = [];
    public function __construct(private array $responses) {}
    public function request(string $method, string $url, array $headers = [], array $json = [], int $timeoutSeconds = 10, int $retryAttempts = 2): array
    {
        $this->calls[] = compact('method', 'url', 'headers', 'json', 'timeoutSeconds', 'retryAttempts');
        return array_shift($this->responses) ?? [];
    }
}

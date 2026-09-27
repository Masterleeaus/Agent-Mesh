<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanMapsIntelligence\\';
    if (str_starts_with($class, $prefix)) {
        $relative = substr($class, strlen($prefix));
        $file = $root.'/'.str_replace('\\', '/', $relative).'.php';
        if (is_file($file)) { require_once $file; }
    }
    $testPrefix = 'Tests\\Fakes\\TitanMapsIntelligence\\';
    if (str_starts_with($class, $testPrefix)) {
        $relative = substr($class, strlen($testPrefix));
        $file = $root.'/tests/Fakes/'.$relative.'.php';
        if (is_file($file)) { require_once $file; }
    }
});

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
use Tests\Fakes\TitanMapsIntelligence\FakeGeocodingProvider;
use Tests\Fakes\TitanMapsIntelligence\FakeRoutingProvider;

final class RuntimeSecretResolver implements SecretResolver { public function resolve(string $credentialReference): string { return 'runtime-key'; } }
final class RuntimeTransport implements ProviderHttpTransport {
    public array $calls = [];
    public function __construct(private array $responses) {}
    public function request(string $method, string $url, array $headers = [], array $json = [], int $timeoutSeconds = 10, int $retryAttempts = 2): array {
        $this->calls[] = compact('method','url','headers','json','timeoutSeconds','retryAttempts');
        return array_shift($this->responses) ?? [];
    }
}

$fail = static function (string $message): never { fwrite(STDERR, $message."\n"); exit(1); };
$config = require $root.'/config/titan_maps_intelligence.php';

$geoRegistry = new GeocodingProviderRegistry();
$geoRegistry->register(new FakeGeocodingProvider());
if ($geoRegistry->get('fake-geocoding')->geocode(new GeocodeRequest('Melbourne'))->provider !== 'fake-geocoding') { $fail('Fake geocoding swap failed'); }
$routeRegistry = new RoutingProviderRegistry();
$routeRegistry->register(new FakeRoutingProvider());
$origin = new Coordinates(-37.8136, 144.9631);
$destination = new Coordinates(-37.8200, 145.0100);
if ($routeRegistry->get('fake-routing')->route(new RouteRequest($origin, $destination))->distanceMetres !== 4200) { $fail('Fake routing swap failed'); }

$geoTransport = new RuntimeTransport([['results' => [[
    'placeId' => 'g-1', 'location' => ['latitude' => -37.8136, 'longitude' => 144.9631],
    'granularity' => 'ROOFTOP', 'formattedAddress' => 'Melbourne VIC, Australia', 'addressComponents' => [],
]]]]);
$geo = new GoogleGeocodingProvider($geoTransport, new RuntimeSecretResolver(), array_replace($config['providers']['google-geocoding'], ['credential_reference' => 'vault://google']));
$geoResult = $geo->geocode(new GeocodeRequest('Melbourne VIC', 'en', 'AU'));
if ($geoResult->providerPlaceId !== 'g-1' || ! str_starts_with($geoTransport->calls[0]['url'], 'https://geocode.googleapis.com/v4/geocode/address/')) { $fail('Google geocoding normalization failed'); }

$routeTransport = new RuntimeTransport([
    ['routes' => [[ 'distanceMeters' => 9200, 'duration' => '1200.4s', 'staticDuration' => '900s', 'polyline' => ['encodedPolyline' => 'abc'] ]]],
    [
        ['originIndex' => 0, 'destinationIndex' => 0, 'condition' => 'ROUTE_EXISTS', 'distanceMeters' => 9200, 'duration' => '1200s', 'staticDuration' => '900s'],
        ['originIndex' => 0, 'destinationIndex' => 1, 'condition' => 'ROUTE_EXISTS', 'distanceMeters' => 14000, 'duration' => '1800s', 'staticDuration' => '1500s'],
    ],
    ['routes' => [[ 'distanceMeters' => 9200, 'duration' => '1200s', 'staticDuration' => '900s' ]]],
]);
$routes = new GoogleRoutesProvider($routeTransport, new RuntimeSecretResolver(), array_replace($config['providers']['google-routes'], ['credential_reference' => 'vault://google']));
$route = $routes->route(new RouteRequest($origin, $destination));
if ($route->durationSeconds !== 1200 || $route->trafficDelaySeconds() !== 300) { $fail('Google route traffic normalization failed'); }
$matrix = $routes->matrix(new RouteMatrixRequest([$origin], [$destination, new Coordinates(-37.84, 145.03)]));
if (count($matrix->elements) !== 2 || $matrix->usage->billableUnits !== 2.0) { $fail('Google matrix normalization/usage failed'); }
$traffic = $routes->traffic(new RouteRequest($origin, $destination, 'DRIVE', 'TRAFFIC_UNAWARE'));
if ($traffic->basis !== 'traffic_aware' || $routeTransport->calls[2]['json']['routingPreference'] !== 'TRAFFIC_AWARE') { $fail('Traffic-aware upgrade failed'); }

fwrite(STDOUT, "Provider runtime behavior: PASS\n");

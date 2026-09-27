<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$required = [
    'Contracts/GeocodingProvider.php',
    'Contracts/RoutingProvider.php',
    'Contracts/TrafficProvider.php',
    'DTO/GeocodeRequest.php',
    'DTO/GeocodeResult.php',
    'DTO/ReverseGeocodeRequest.php',
    'DTO/RouteRequest.php',
    'DTO/RouteResult.php',
    'DTO/RouteMatrixRequest.php',
    'DTO/RouteMatrixElement.php',
    'DTO/RouteMatrixResult.php',
    'DTO/TrafficEstimate.php',
    'Providers/GeocodingProviderRegistry.php',
    'Providers/RoutingProviderRegistry.php',
    'Providers/TrafficProviderRegistry.php',
    'Providers/GoogleGeocodingProvider.php',
    'Providers/GoogleRoutesProvider.php',
    'Support/GoogleDurationParser.php',
    'Services/GeocodingService.php',
    'Services/RoutingService.php',
    'Services/TrafficService.php',
    'tests/Fakes/FakeGeocodingProvider.php',
    'tests/Fakes/FakeRoutingProvider.php',
    'tests/Fakes/FakeTrafficProvider.php',
];

$missing = [];
foreach ($required as $file) {
    if (! is_file($root.'/'.$file)) {
        $missing[] = $file;
    }
}

if ($missing !== []) {
    fwrite(STDERR, "Provider abstraction verification failed; missing:\n - ".implode("\n - ", $missing)."\n");
    exit(1);
}

$provider = file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
foreach (['GeocodingProviderRegistry', 'RoutingProviderRegistry', 'TrafficProviderRegistry', 'google-geocoding', 'google-routes'] as $needle) {
    if (! str_contains((string) $provider, $needle)) {
        fwrite(STDERR, "Provider abstraction verification failed; service provider is missing {$needle}.\n");
        exit(1);
    }
}

$transport = file_get_contents($root.'/Providers/LaravelProviderHttpTransport.php');
foreach (['places.googleapis.com', 'geocode.googleapis.com', 'routes.googleapis.com'] as $host) {
    if (! str_contains((string) $transport, $host)) {
        fwrite(STDERR, "Provider abstraction verification failed; transport allowlist is missing {$host}.\n");
        exit(1);
    }
}

$config = require $root.'/config/titan_maps_intelligence.php';
foreach (['google-places', 'google-geocoding', 'google-routes'] as $id) {
    if (! isset($config['providers'][$id])) {
        fwrite(STDERR, "Provider abstraction verification failed; config is missing {$id}.\n");
        exit(1);
    }
}

fwrite(STDOUT, "Provider abstraction verification: PASS\n");

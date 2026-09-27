<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root.'/Services/EncodedPolylineDecoder.php';

use App\Extensions\TitanMapsIntelligence\Services\EncodedPolylineDecoder;

$points = (new EncodedPolylineDecoder())->decode('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
$expected = [
    ['lat' => 38.5, 'lng' => -120.2],
    ['lat' => 40.7, 'lng' => -120.95],
    ['lat' => 43.252, 'lng' => -126.453],
];
if (count($points) !== count($expected)) {
    fwrite(STDERR, "FAIL: encoded polyline point count mismatch\n");
    exit(1);
}
foreach ($expected as $i => $point) {
    if (abs($points[$i]['lat'] - $point['lat']) > 0.000001 || abs($points[$i]['lng'] - $point['lng']) > 0.000001) {
        fwrite(STDERR, "FAIL: encoded polyline point {$i} mismatch\n");
        exit(1);
    }
}
$config = require $root.'/config/titan_maps_intelligence.php';
$url = (string) ($config['map_ui']['tile_url'] ?? '');
if (! str_starts_with($url, 'https://') || ! str_contains($url, '{z}') || ! str_contains($url, '{x}') || ! str_contains($url, '{y}')) {
    fwrite(STDERR, "FAIL: tile template is not a valid HTTPS slippy-map template\n");
    exit(1);
}

echo "Graphical map runtime behavior: PASS\n";

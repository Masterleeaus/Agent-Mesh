<?php

declare(strict_types=1);

require_once dirname(__DIR__).'/Support/GeofenceMath.php';

use App\Extensions\TitanMapsIntelligence\Support\GeofenceMath;

$math = new GeofenceMath();
$fail = static function (string $message): never { fwrite(STDERR, $message."\n"); exit(1); };

if (! $math->circleContains(-37.8100, 144.9600, 100.0, -37.8100, 144.9600, 5.0, false, 10.0)) $fail('Circle center should be inside.');
if ($math->circleContains(-37.8100, 144.9600, 100.0, -37.8089, 144.9600, 5.0, false, 10.0)) $fail('Entry hysteresis should reject a noisy boundary sample.');
if (! $math->circleContains(-37.8100, 144.9600, 100.0, -37.8089, 144.9600, 5.0, true, 20.0)) $fail('Exit hysteresis should preserve current inside state near boundary.');
$polygon = [['lat'=>-37.82,'lng'=>144.95],['lat'=>-37.82,'lng'=>144.97],['lat'=>-37.80,'lng'=>144.97],['lat'=>-37.80,'lng'=>144.95]];
if (! $math->pointInPolygon(-37.81, 144.96, $polygon)) $fail('Polygon should contain center point.');
if ($math->pointInPolygon(-37.85, 144.96, $polygon)) $fail('Polygon should exclude outside point.');
if ($math->distanceMetres(-37.81, 144.96, -37.81, 144.96) > 0.001) $fail('Same coordinate distance should be zero.');

echo "Geofence math runtime behavior: PASS\n";

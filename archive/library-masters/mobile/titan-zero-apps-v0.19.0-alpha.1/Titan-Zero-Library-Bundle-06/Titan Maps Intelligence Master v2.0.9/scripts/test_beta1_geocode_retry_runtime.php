<?php

declare(strict_types=1);

require_once __DIR__.'/../Services/GeocodeRetryPolicy.php';

use App\Extensions\TitanMapsIntelligence\Services\GeocodeRetryPolicy;

$policy = new GeocodeRetryPolicy();
$errors = [];
$expected = [300, 3600, 86400, 86400, null];
foreach ($expected as $i => $seconds) {
    $actual = $policy->retryAfterSeconds($i + 1);
    if ($actual !== $seconds) $errors[] = 'retry '.($i+1).' expected '.var_export($seconds,true).' got '.var_export($actual,true);
}
$a = $policy->fingerprint('  12 High-St., Melbourne VIC  ');
$b = $policy->fingerprint('12 high st melbourne vic');
if ($a !== $b) $errors[] = 'address variations must share fingerprint';
if (!$policy->isBlockedAfterFailureCount(5)) $errors[] = 'five failures must block automatic retry';
if ($policy->confidenceForPrecision('ROOFTOP') !== 'high') $errors[] = 'rooftop should be high confidence';
if ($policy->confidenceForPrecision('RANGE_INTERPOLATED') !== 'medium') $errors[] = 'interpolated should be medium confidence';
if ($policy->confidenceForPrecision(null) !== 'low') $errors[] = 'missing precision should be low confidence';

if ($errors) { fwrite(STDERR, "FAIL\n - ".implode("\n - ",$errors)."\n"); exit(1); }
echo "PASS geocode retry/runtime policy\n";

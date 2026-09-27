<?php

declare(strict_types=1);
require_once dirname(__DIR__).'/Support/GeofenceTransitionFilter.php';
use App\Extensions\TitanMapsIntelligence\Support\GeofenceTransitionFilter;

$filter = new GeofenceTransitionFilter();
$inside = false; $candidate = null; $samples = 0; $transitions = [];
foreach ([false,true,false,true,true,true,false,true,false,false] as $observed) {
    $result = $filter->next($inside, $candidate, $samples, $observed, 2);
    $candidate = $result['candidate_state']; $samples = $result['candidate_samples'];
    if ($result['transition'] !== null) {
        $transitions[] = $result['transition'];
        $inside = $result['transition'] === 'inside';
    }
}
if ($transitions !== ['inside','outside']) {
    fwrite(STDERR, 'Jitter trace produced unexpected transitions: '.json_encode($transitions)."\n"); exit(1);
}
echo "Geofence transition jitter runtime behavior: PASS\n";

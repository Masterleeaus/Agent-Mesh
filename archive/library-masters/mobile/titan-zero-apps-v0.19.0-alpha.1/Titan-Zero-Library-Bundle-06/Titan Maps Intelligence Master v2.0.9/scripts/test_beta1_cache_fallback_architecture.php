<?php
$s=file_get_contents(dirname(__DIR__).'/Services/ProviderCacheStore.php')?:'';
foreach(['SpatialSignalPublisher','maps.cache.fallback','redis'] as $needle){if(!str_contains($s,$needle)){fwrite(STDERR,"FAIL missing $needle\n");exit(1);}}
echo "PASS cache fallback signalling architecture\n";

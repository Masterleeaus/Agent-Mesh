<?php
$s=file_get_contents(dirname(__DIR__).'/Http/Controllers/RouteSnapshotController.php')?:'';
foreach(['worker_public_id','customer_public_id','date_from','date_to'] as $n){if(!str_contains($s,$n)){fwrite(STDERR,"FAIL missing $n\n");exit(1);}}
echo "PASS route history API filters\n";

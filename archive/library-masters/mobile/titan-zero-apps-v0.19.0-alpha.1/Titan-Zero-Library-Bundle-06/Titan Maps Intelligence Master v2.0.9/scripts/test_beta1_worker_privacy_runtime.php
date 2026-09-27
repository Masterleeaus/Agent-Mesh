<?php
$root = dirname(__DIR__);
$checks = [
    'state share history field' => ["Models/MapWorkerTrackingState.php", "share_history_until"],
    'state device hash field' => ["Models/MapWorkerTrackingState.php", "device_id_hash"],
    'ingest accepts trusted device id' => ["Services/WorkerTrackingService.php", "deviceId"],
    'device flood error' => ["Services/WorkerTrackingService.php", "MAPS_LOCATION_DEVICE_RATE_LIMITED"],
    'anomaly investigation signal' => ["Services/WorkerTrackingService.php", "maps.gps.anomaly.investigation"],
    'stale team filter' => ["Services/MapViewDataService.php", "workerLocationStaleAfterSeconds"],
    'history share gate' => ["Services/MapViewDataService.php", "share_history_until"],
    'retention profiles' => ["Services/WorkerLocationRetentionService.php", "forensic"],
];
$failed=[];
foreach($checks as $label=>[$file,$needle]) { $text=@file_get_contents($root.'/'.$file) ?: ''; if(!str_contains($text,$needle)) $failed[]="$label ($file missing $needle)"; }
if($failed){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$failed)."\n"); exit(1);} echo "PASS beta1 worker privacy/GPS hardening\n";

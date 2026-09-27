<?php
$root=dirname(__DIR__);$fails=[];$ok=0;$check=function(bool $v,string $m)use(&$fails,&$ok){if($v)$ok++;else$fails[]=$m;};$read=fn($p)=>(string)@file_get_contents($root.'/'.$p);
$release=json_decode($read('release.json'),true)?:[];$check(version_compare((string)($release['version']??'0'),'2.0.0-beta.1.12','>='),'Maps version not advanced to Pass 14');
foreach(['Services/OfflineWorkerLocationSyncService.php','database/migrations/2026_08_18_000700_extend_offline_worker_location_sync.php','docs/PASS14_OFFLINE_WORKER_LOCATION_SYNC.md'] as $p)$check(is_file($root.'/'.$p),'missing '.$p);
$contract=$read('Contracts/FieldSpatialPeerGateway.php');$check(str_contains($contract,'syncOfflineWorkerLocations'),'Field spatial peer contract missing offline sync');
$peer=$read('Services/FieldSpatialPeerService.php');$check(str_contains($peer,'syncOfflineWorkerLocations'),'Field spatial peer service missing offline sync');
$service=$read('Services/OfflineWorkerLocationSyncService.php');
foreach(['maximum_batch_size','client_sample_id','offline_sync','historical_only','live_eligible','retention_expires_at','tracking_allowed','on_duty','status_changed_at','maximumLocationAccuracyMetres','maximumFutureSkewSeconds','maximumCaptureAgeSeconds','dedupe_key','captured_at','received_at','WorkerTrackingService'] as $t)$check(str_contains($service,$t),'offline worker location sync missing '.$t);
$check(str_contains($service,'MAPS_LOCATION_COORDINATES_INVALID'),'offline peer sync must validate coordinate bounds');
$check(str_contains($service,'historical_only') && str_contains($service,'live_eligible'),'stale offline samples may not blindly become current location');
$controller=$read('Http/Controllers/WorkerTrackingController.php');foreach(['offlineSync','samples','client_sample_id','device_id'] as $t)$check(str_contains($controller,$t),'tracking controller missing '.$t);
$routes=$read('routes/api.php');$check(str_contains($routes,'/worker-tracking/offline-sync'),'offline worker tracking route missing');
$migration=$read('database/migrations/2026_08_18_000700_extend_offline_worker_location_sync.php');foreach(['client_sample_id','offline_sync','retention_expires_at','maps_location_pings'] as $t)$check(str_contains($migration,$t),'offline maps migration missing '.$t);
$model=$read('Models/MapLocationPing.php');foreach(['client_sample_id','offline_sync','retention_expires_at'] as $t)$check(str_contains($model,$t),'MapLocationPing missing '.$t);
$config=$read('config/titan_maps_intelligence.php');foreach(['offline_max_batch_size','offline_max_age_days'] as $t)$check(str_contains($config,$t),'Maps config missing '.$t);
$offlineManifest=$read('Services/OfflineSpatialCapabilityManifest.php');$check(str_contains($offlineManifest,'worker.location.offline-sync'),'offline capability manifest missing worker location sync');
$verify=$read('scripts/verify_beta1_release_contract.php');$check(str_contains($verify,'beta.1.12')||str_contains($verify,'version_compare'),'release verifier not updated for Pass 14');
if($fails){foreach($fails as $f)fwrite(STDERR,"FAIL: $f\n");fwrite(STDERR,count($fails)." failures\n");exit(1);}echo "PASS Maps joint Pass 14 offline worker location sync ($ok assertions)\n";

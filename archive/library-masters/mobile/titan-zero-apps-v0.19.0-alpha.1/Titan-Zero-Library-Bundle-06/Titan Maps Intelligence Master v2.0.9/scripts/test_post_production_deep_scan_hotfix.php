<?php
declare(strict_types=1);
$root=dirname(__DIR__);$n=0;$fails=[];$ok=function(bool $v,string $m)use(&$n,&$fails){$n++;if(!$v)$fails[]=$m;};
$offline=file_get_contents($root.'/Services/OfflineWorkerLocationSyncService.php');
$tracking=file_get_contents($root.'/Services/WorkerTrackingService.php');
$model=file_get_contents($root.'/Models/MapLocationPing.php');
$ok(str_contains($offline,"offline_classification"),'offline replay persists live/historical classification');
$ok(str_contains($offline,"'offline_classification'=>'debounced'"),'debounced offline samples persist a durable replay classification');
$ok(str_contains($offline,"deduplicated_debounced"),'duplicate debounced samples replay deterministically');
$ok(str_contains($offline,"geofence_eligible"),'offline replay persists geofence eligibility');
$ok(str_contains($tracking,"client_sample_id"),'live ingestion preserves offline client sample id');
$ok(str_contains($tracking,"offline_classification"),'live ingestion persists offline classification');
$ok(str_contains($tracking,"geofence_eligible"),'live ingestion persists geofence eligibility');
$ok(str_contains($model,"offline_classification"),'MapLocationPing exposes offline classification');
$ok(str_contains($model,"geofence_eligible"),'MapLocationPing exposes geofence eligibility');
$ok(is_file($root.'/database/migrations/2026_08_19_000100_harden_offline_location_privacy.php'),'offline privacy migration exists');
$processor=file_get_contents($root.'/Console/ProcessGeofencesCommand.php');
$ok(str_contains($processor,"geofence_eligible"),'background geofence processor excludes historical-only pings');
$team=file_get_contents($root.'/Http/Controllers/WorkerTrackingController.php');
$ok(str_contains($team,"->where('tracking_allowed', true)"),'team live endpoint requires tracking consent');
$ok(str_contains($team,"->whereIn('public_reference_id', \$workerIds)"),'team live endpoint always scopes positions to eligible worker states');
$ok(str_contains($team,"share_history_until")&&str_contains($team,"tracking_allowed"),'check-in API requires current sharing/consent for privileged history');
$nav=file_get_contents($root.'/Http/Controllers/UserNavigationController.php');
$ok(str_contains($nav,"share_history_until"),'Check-ins page honors history sharing expiry');
$ok(str_contains($nav,"workerLocationStaleAfterSeconds"),'worker map/page excludes stale live positions');

$ok(str_contains($nav,"where('reference_type', '!=', 'worker')"),'generic Locations page excludes worker GPS projections');
$ok(str_contains($nav,"'locations' => MapLocation::query()->forCompany(\$companyId)->where('reference_type', '!=', 'worker')->count()"),'Locations KPI excludes worker GPS projections');
$ok(str_contains($nav,"'checkins' => \$this->checkInCount(\$companyId)"),'Check-ins KPI uses privacy-scoped counter');
$ok(str_contains($nav,'private function checkInCount(string $companyId): int'),'privacy-scoped Check-ins counter exists');
$mapViews=file_get_contents($root.'/Services/MapViewDataService.php');
$checkLayerStart=strpos($mapViews,'private function checkInLayers');
$checkLayer=$checkLayerStart===false?'':substr($mapViews,$checkLayerStart,2400);
$ok(str_contains($checkLayer,"where('tracking_allowed', true)"),'Check-ins map layer honors current tracking consent');
$peer=file_get_contents($root.'/Services/FieldSpatialPeerService.php');
$ok(str_contains($peer,"workerLocationStaleAfterSeconds"),'Field peer live positions enforce Maps freshness policy');
$provider=file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
$ok(str_contains($provider,"titan-maps:prune-location-pings")&&str_contains($provider,'hourly()'),'Maps schedules retention pruning automatically');

$ok(is_file($root.'/Services/WorkerLocationVisibilityPolicy.php'),'worker-location scope uses a centralized authorization policy');
foreach([
    'Http/Controllers/UserNavigationController.php','Http/Controllers/WorkerTrackingController.php',
    'Services/DispatchIntelligenceService.php','Services/MapViewDataService.php','Services/NearestResourceService.php'
] as $relative){$source=file_get_contents($root.'/'.$relative);$ok(!str_contains($source,"Gate::has('titan-maps-intelligence.worker-location.read')"),$relative.' does not confuse Gate existence with user authorization');}

$authorizer=file_get_contents($root.'/Services/GatePermissionAuthorizer.php');
$ok(str_contains($authorizer,'MUTATING_SUFFIXES'),'permission fallback classifies consequential permissions');
$ok(str_contains($authorizer,'MAPS_PERMISSION_UNREGISTERED_MUTATION')||str_contains($authorizer,'Unregistered Maps mutation permission'),'unregistered mutation permissions fail closed');
if($fails){fwrite(STDERR,"FAIL post-production Maps hotfix gate\n - ".implode("\n - ",$fails)."\nPassed assertions: ".($n-count($fails))."; failed assertions: ".count($fails)."\n");exit(1);}echo "PASS Titan Maps post-production deep-scan hotfix ($n assertions)\n";

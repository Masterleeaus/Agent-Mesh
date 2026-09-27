<?php
$root=dirname(__DIR__); $fails=[]; $ok=0;
$check=function(bool $v,string $m)use(&$fails,&$ok){if($v){$ok++;}else{$fails[]=$m;}};
$read=fn($p)=>(string)@file_get_contents($root.'/'.$p);
$manifest=json_decode($read('extension.manifest.json'),true)?:[];
$check(version_compare((string)($manifest['version']??'0'),'2.0.0-beta.1.9','>='),'Maps version not advanced');
foreach([
'Contracts/FieldSpatialPeerGateway.php','Services/FieldSpatialPeerService.php','Services/TitanFieldReferenceGateway.php','Services/TitanFieldDispatchEvidenceGateway.php','Services/TitanFieldWorkerQualificationGateway.php','Services/TitanFieldDispatchAssignmentGateway.php','docs/PASS11_TITAN_FIELD_PEER_BRIDGE.md'
] as $p)$check(is_file($root.'/'.$p),'missing '.$p);
$peer=$read('Contracts/FieldSpatialPeerGateway.php'); foreach(['healthy','latestWorkerPositions','estimateTravel','recordWorkerLocation','mapPayload','mapUi'] as $t)$check(str_contains($peer,$t),'peer contract missing '.$t);
$service=$read('Services/FieldSpatialPeerService.php'); foreach(['maps_worker_tracking_states','map_locations','RouteCalculationService','WorkerTrackingService','MapViewDataService','mapUi'] as $t)$check(str_contains($service,$t),'peer service missing '.$t);
$provider=$read('System/TitanMapsIntelligenceServiceProvider.php'); foreach(['FieldSpatialPeerGateway','FieldSpatialPeerService','TitanFieldReferenceGateway','TitanFieldDispatchEvidenceGateway','TitanFieldWorkerQualificationGateway','TitanFieldDispatchAssignmentGateway','App\\\\Extensions\\\\TitanField\\\\System\\\\TitanFieldServiceProvider'] as $t)$check(str_contains($provider,$t),'provider peer selection missing '.$t);
$check(str_contains($provider,'FieldCommandGateway') && str_contains($provider,'->bound($fieldCommandGateway)'), 'provider does not require active Field command binding before preferring Field adapters');
$ref=$read('Services/TitanFieldReferenceGateway.php'); foreach(['crm_work_orders','crm_service_locations','crm_field_worker_profiles','company_id'] as $t)$check(str_contains($ref,$t),'Field reference adapter missing '.$t);
$evidence=$read('Services/TitanFieldDispatchEvidenceGateway.php'); foreach(['crm_work_orders','crm_appointments','crm_dispatch_assignments','source'=>'titan-field'] as $t)$check(str_contains($evidence,$t),'Field evidence adapter missing '.$t);
$qual=$read('Services/TitanFieldWorkerQualificationGateway.php'); foreach(['crm_field_worker_profiles','skills','certifications','source'=>'titan-field'] as $t)$check(str_contains($qual,$t),'Field qualification adapter missing '.$t);
$assignment=$read('Services/TitanFieldDispatchAssignmentGateway.php'); foreach(['FieldCommandGateway','titan.field.dispatch','assign_dispatch','governed'] as $t)$check(str_contains($assignment,$t),'Field governed assignment adapter missing '.$t);
$check(!str_contains($assignment,"DB::table('crm_dispatch_assignments')->insert"),'Maps Field adapter directly writes dispatch table');
if($fails){foreach($fails as $f)fwrite(STDERR,"FAIL: $f\n"); fwrite(STDERR,count($fails)." failures\n"); exit(1);} echo "PASS Titan Maps Pass 11 Titan Field peer bridge ($ok assertions)\n";

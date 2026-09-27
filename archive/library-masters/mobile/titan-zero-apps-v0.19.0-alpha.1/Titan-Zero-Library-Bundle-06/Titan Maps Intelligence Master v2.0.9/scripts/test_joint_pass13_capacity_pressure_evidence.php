<?php
$root=dirname(__DIR__); $fails=[]; $ok=0;
$check=function(bool $v,string $m)use(&$fails,&$ok){if($v){$ok++;}else{$fails[]=$m;}};
$read=fn($p)=>(string)@file_get_contents($root.'/'.$p);
$manifest=json_decode($read('extension.manifest.json'),true)?:[];
$check(version_compare((string)($manifest['version']??'0'),'2.0.0-beta.1.11','>='),'Maps version not advanced to Pass 13');
$check(($manifest['architecture']['profile']??null)==='intelligence-engine','canonical architecture profile missing');
$peer=$read('Contracts/FieldSpatialPeerGateway.php'); $check(str_contains($peer,'capacityPressureEvidence'),'peer contract missing capacityPressureEvidence');
$service=$read('Services/FieldSpatialPeerService.php');
foreach(['capacityPressureEvidence','NearestResourceService','TerritoryEvaluation','demand_points','freshness','uncovered_demand_count','nearest_worker_duration_seconds','nearest_worker_distance_meters','financial_authority'] as $t)$check(str_contains($service,$t),'peer service missing '.$t);
$check(!str_contains($service,"DB::table('crm_"),'Maps capacity peer must not query Field operational tables');
$check(!str_contains($service,'->insert('),'Maps capacity evidence must remain read-only');
$check(!str_contains($service,'->update('),'Maps capacity evidence must remain read-only');
$doc=$read('docs/PASS13_FIELD_CAPACITY_PRESSURE_EVIDENCE.md'); foreach(['capacity pressure','read-only','non-authoritative','travel matrix','territory','freshness'] as $t)$check(str_contains(strtolower($doc),strtolower($t)),'Maps Pass13 doc missing '.$t);
$provider=$read('System/TitanMapsIntelligenceServiceProvider.php'); $check(str_contains($provider,'NearestResourceService'),'Maps provider does not expose nearest-resource dependency');
if($fails){foreach($fails as $f)fwrite(STDERR,"FAIL: $f\n"); fwrite(STDERR,count($fails)." failures\n"); exit(1);} echo "PASS Titan Maps Pass 13 capacity pressure evidence ($ok assertions)\n";

<?php
$root=dirname(__DIR__); $fails=[]; $ok=0;
$check=function(bool $v,string $m)use(&$fails,&$ok){if($v){$ok++;}else{$fails[]=$m;}};
$read=fn($p)=>(string)@file_get_contents($root.'/'.$p);
$manifest=json_decode($read('extension.manifest.json'),true)?:[];
$check(version_compare((string)($manifest['version']??'0'),'2.0.0-beta.1.10','>='),'Maps version not advanced to Pass 12');
$check(($manifest['architecture']['profile']??null)==='intelligence-engine','canonical architecture profile missing');
$peer=$read('Contracts/FieldSpatialPeerGateway.php'); $check(str_contains($peer,'workOrderCostEvidence'),'peer contract missing workOrderCostEvidence');
$service=$read('Services/FieldSpatialPeerService.php');
foreach(['workOrderCostEvidence','FieldReferenceGateway','RouteSnapshot','TerritoryEvaluation','pricing_signals','road_distance_meters','duration_seconds','authoritative','application_status'] as $t)$check(str_contains($service,$t),'peer service missing '.$t);
$check(!str_contains($service,"DB::table('crm_"),'peer service must not query Field financial tables directly');
$check(!str_contains($service,"->insert("),'peer spatial evidence method/service must not insert Field financial state');
$check(!str_contains($service,"->update("),'peer spatial evidence method/service must not update Field financial state');
$doc=$read('docs/PASS12_FIELD_SPATIAL_COST_EVIDENCE.md'); foreach(['spatial evidence','advisory','does not calculate profit','does not write financial'] as $t)$check(str_contains(strtolower($doc),strtolower($t)),'Maps Pass12 doc missing '.$t);
$provider=$read('System/TitanMapsIntelligenceServiceProvider.php'); $check(str_contains($provider,'FieldSpatialPeerService'),'peer binding missing');
if($fails){foreach($fails as $f)fwrite(STDERR,"FAIL: $f\n"); fwrite(STDERR,count($fails)." failures\n"); exit(1);} echo "PASS Titan Maps Pass 12 spatial cost evidence ($ok assertions)\n";

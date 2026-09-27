<?php

declare(strict_types=1);
$root=dirname(__DIR__);$errors=[];
$required=[
'DTO/ResourceFallbackScoreResult.php','Services/ResourceFallbackScoreService.php','Services/ResourceFallbackStagePolicy.php','Services/ResourceFallbackService.php','Services/ResourceFallbackCandidateEnricher.php',
'Models/ResourceFallbackRequest.php','Models/ResourceFallbackCandidate.php','Models/ResourceFallbackDecision.php','Http/Controllers/ResourceFallbackController.php',
'Http/Requests/StartResourceFallbackRequest.php','Http/Requests/DecideResourceFallbackRequest.php','Http/Requests/PromoteResourceFallbackRequest.php',
'Tools/StartResourceFallbackTool.php','Tools/ReadResourceFallbackTool.php','Tools/DecideResourceFallbackTool.php','Tools/PromoteResourceFallbackTool.php',
'resources/views/user/resource-fallback.blade.php'];
foreach($required as $f)if(!is_file($root.'/'.$f))$errors[]="missing {$f}";
$migrations=glob($root.'/database/migrations/*resource_fallback*.php')?:[];if(count($migrations)<4)$errors[]='expected 3 schema + 1 menu-sync resource fallback migrations';
$menu=@file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php')?:'';if(!str_contains($menu,'Resource Fallback'))$errors[]='menu missing Resource Fallback';
$userRoutes=@file_get_contents($root.'/routes/user.php')?:'';foreach(['resource-fallback','resource-fallback/start','resource-fallback/{mapsResourceFallback}/refresh'] as $n)if(!str_contains($userRoutes,$n))$errors[]="user route missing {$n}";
$api=@file_get_contents($root.'/routes/api.php')?:'';foreach(['resource-fallbacks','resource-fallbacks/{mapsResourceFallback}/refresh','resource-fallbacks/{mapsResourceFallback}/decide','resource-fallbacks/{mapsResourceFallback}/promote'] as $n)if(!str_contains($api,$n))$errors[]="api route missing {$n}";
$cap=@file_get_contents($root.'/Services/MapsCapabilityService.php')?:'';foreach(['resource-fallback.start','resource-fallback.read','resource-fallback.decide','resource-fallback.promote'] as $n)if(!str_contains($cap,$n))$errors[]="capability missing {$n}";
$manifest=json_decode((string)@file_get_contents($root.'/extension.manifest.json'),true)?:[];foreach(['titan-maps-intelligence.resource-fallback.start','titan-maps-intelligence.resource-fallback.read','titan-maps-intelligence.resource-fallback.decide','titan-maps-intelligence.resource-fallback.promote'] as $n){if(!in_array($n,$manifest['capabilities']??[],true))$errors[]="manifest capability missing {$n}";if(!in_array($n,$manifest['permissions']??[],true))$errors[]="manifest permission missing {$n}";}
$service=@file_get_contents($root.'/Services/ResourceFallbackService.php')?:'';foreach(['internal_available','approved_network_review','discovery_searching','CandidatePromotionService','CandidateReviewService'] as $n)if(!str_contains($service,$n))$errors[]="workflow missing {$n}";
foreach(['maps_resource_fallback_requests','maps_resource_fallback_candidates','maps_resource_fallback_decisions'] as $table){
 if(!in_array($table,$manifest['database']['owned_tables']??[],true))$errors[]="manifest missing owned table {$table}";
}

$requestMigration=@file_get_contents($root.'/database/migrations/2026_08_11_001200_create_maps_resource_fallback_requests_table.php')?:'';
foreach(['operational_need_type','operational_need_public_id','open_now'] as $n)if(!str_contains($requestMigration,$n))$errors[]="fallback request migration missing {$n}";
foreach(['inventory_shortage','AuditRecorder','resource_fallback.started','resource_fallback.discovery_started','resource_fallback.promoted'] as $n)if(!str_contains($service,$n))$errors[]="workflow/audit lineage missing {$n}";
$promote=@file_get_contents($root.'/Tools/PromoteResourceFallbackTool.php')?:'';if(!str_contains($promote,"confirmed"))$errors[]='AI promotion tool must require confirmed';
if($errors){fwrite(STDERR,"Resource fallback verification FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);}echo "Resource fallback verification: PASS\n";

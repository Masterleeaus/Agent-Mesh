<?php

declare(strict_types=1);

$root=dirname(__DIR__);$errors=[];
$service=(string)@file_get_contents($root.'/Services/MapsCapabilityService.php');
if(str_contains($service,"'execution_origin' =>")) $errors[]='execution_origin is still exposed as a model/tool input property';
$governed=[
'Tools/GeocodeLocationTool.php','Tools/LookupTerritoryTool.php','Tools/ValidateTerritoryTool.php','Tools/EstimateRouteTool.php',
'Tools/CompareRoutesTool.php','Tools/GetJobTravelContextTool.php','Tools/CheckServiceAreaTool.php','Tools/NearbySearchTool.php',
'Tools/PromoteCandidateTool.php','Tools/DecideDispatchRecommendationTool.php','Tools/PromoteResourceFallbackTool.php','Tools/ManageServiceTerritoryTool.php',
'Tools/ManageRoutePlanTool.php','Tools/ApproveCandidateTool.php','Tools/RejectCandidateTool.php','Tools/DecideResourceFallbackTool.php',
];
foreach($governed as $file){$text=(string)@file_get_contents($root.'/'.$file);if(!str_contains($text,"['execution_origin']='ai'")&&!str_contains($text,"['execution_origin'] = 'ai'"))$errors[]="{$file} does not force AI execution origin internally";}
if($errors){fwrite(STDERR,"Execution-origin security FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);}echo "Execution-origin security: PASS\n";

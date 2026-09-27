<?php

declare(strict_types=1);
$root=dirname(__DIR__);$errors=[];
$dispatch=@file_get_contents($root.'/Services/CrmDispatchAssignmentGateway.php')?:'';
foreach(['SpatialCommandBusGateway','job.assign','idempotency'] as $n)if(!str_contains($dispatch,$n))$errors[]="Dispatch assignment gateway missing {$n}";
foreach(['App\\Extensions\\Crm\\System\\Domains\\FieldServices\\Dispatch\\DispatchService','->assign('] as $n)if(str_contains($dispatch,$n))$errors[]="Dispatch assignment gateway still performs direct CRM service mutation via {$n}";
foreach(['Tools/PromoteCandidateTool.php','Tools/DecideDispatchRecommendationTool.php','Tools/PromoteResourceFallbackTool.php','Tools/ManageServiceTerritoryTool.php','Tools/ManageRoutePlanTool.php','Tools/ApproveCandidateTool.php','Tools/RejectCandidateTool.php','Tools/DecideResourceFallbackTool.php'] as $file){$t=@file_get_contents($root.'/'.$file)?:'';if(!str_contains($t,'GovernedSpatialCapabilityExecutor'))$errors[]="{$file} does not use governed executor";if(!str_contains($t,"execution_origin"))$errors[]="{$file} does not force governed AI origin";}
if($errors){fwrite(STDERR,"Command Bus boundary verification FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);}echo "Command Bus boundary verification: PASS\n";

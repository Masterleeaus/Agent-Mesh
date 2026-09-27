<?php

declare(strict_types=1);
$root=$argv[1]??null;if(!is_string($root)||!is_dir($root)){fwrite(STDERR,"usage: php verify_pass16_workspace_snapshot.php /path/to/website-root\n");exit(2);}
$required=[
'app/Models/TitanWorkspaceProject.php','app/Models/TitanWorkspaceProjectItem.php','app/Services/TitanWorkspaceProjectService.php','app/Services/TitanWorkspaceContextService.php','app/Http/Controllers/TitanWorkspaceProjectController.php',
];
foreach($required as$f)if(!is_file($root.'/'.$f)){fwrite(STDERR,"FAIL host workspace primitive missing {$f}\n");exit(1);}
$project=(string)file_get_contents($root.'/app/Models/TitanWorkspaceProject.php');
$item=(string)file_get_contents($root.'/app/Models/TitanWorkspaceProjectItem.php');
$service=(string)file_get_contents($root.'/app/Services/TitanWorkspaceProjectService.php');
$context=(string)file_get_contents($root.'/app/Services/TitanWorkspaceContextService.php');
$controller=(string)file_get_contents($root.'/app/Http/Controllers/TitanWorkspaceProjectController.php');
foreach(['protected $table = \'titan_workspace_projects\'','function items(): HasMany']as$n)if(!str_contains($project,$n)){fwrite(STDERR,"FAIL project model contract changed: {$n}\n");exit(1);}
foreach(['protected $table = \'titan_workspace_project_items\'','\'item_type\', \'item_id\'']as$n)if(!str_contains($item,$n)){fwrite(STDERR,"FAIL project item contract changed: {$n}\n");exit(1);}
foreach(['projectsForUser','resolveCurrent','sanitizeContext','mergeContext','detachProjectWorkbooks']as$n)if(!str_contains($service,$n)){fwrite(STDERR,"FAIL workspace project service contract changed: {$n}\n");exit(1);}
foreach(['titan.assist.context','business_id','customer_id','job_id','invoice_id','asset_id']as$n)if(!str_contains($context,$n)){fwrite(STDERR,"FAIL workspace context bridge changed: {$n}\n");exit(1);}
foreach(['attachItem','detachItem','verifyDomainItemOwnership']as$n)if(!str_contains($controller,$n)){fwrite(STDERR,"FAIL workspace controller contract changed: {$n}\n");exit(1);}
$detachPos=strpos($controller,'public function detachItem');$nextPos=strpos($controller,'public function openFromChatMessage',$detachPos);$detach=substr($controller,$detachPos,$nextPos-$detachPos);
if(!str_contains($detach,'TitanWorkspaceProjectItem::query()')||!str_contains($detach,'->delete()')){fwrite(STDERR,"FAIL detach membership semantics changed\n");exit(1);}
foreach(['Customer','Invoice','WorkOrder','Asset']as$forbidden){if(str_contains($detach,$forbidden.'::query()')){fwrite(STDERR,"FAIL detach now touches authoritative {$forbidden} data\n");exit(1);}}
echo "PASS16_WORKSPACE_SNAPSHOT_OK authority=titan_workspace_projects membership_delete_only=true context_bridge=titan.assist.context\n";

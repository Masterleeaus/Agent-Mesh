<?php

declare(strict_types=1);
$root=dirname(__DIR__);
$manifest=json_decode((string)file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
if(version_compare((string)($manifest['version']??'0.0.0'),'0.16.0','<')){fwrite(STDERR,"FAIL manifest version regressed below Pass 16\n");exit(1);}
if(!in_array('working-sets-workspace-context',$manifest['health']['dependency_checks']??[],true)){fwrite(STDERR,"FAIL working-set health dependency missing\n");exit(1);}
$files=glob($root.'/System/WorkingSet/*.php')?:[];
$forbidden=['Illuminate'.'\\Support\\Facades\\DB','D'.'B::table(','->'.'insert(','->'.'update(','->'.'delete('];
foreach($files as$f){$s=(string)file_get_contents($f);foreach($forbidden as$needle){if(str_contains($s,$needle)){fwrite(STDERR,'FAIL working-set runtime contains direct persistence primitive in '.basename($f)."\n");exit(1);}}}
$composer=(string)file_get_contents($root.'/System/WorkingSet/WorkingSetWorkspaceComposer.php');
foreach(['membership_grants_authorization','deletes_authoritative_data','payloads_included']as$needle){if(!str_contains($composer,$needle)){fwrite(STDERR,"FAIL working-set safety marker missing {$needle}\n");exit(1);}}
echo "PASS16_HEALTH_OK\n";

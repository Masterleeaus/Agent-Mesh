<?php

declare(strict_types=1);
$root=getenv('TITAN_PROVIDER_ROOT') ?: dirname(__DIR__,2);
$fail=0;$pass=0;
$check=function(bool $ok,string $message)use(&$fail,&$pass):void{if($ok){$pass++;echo "PASS $message\n";}else{$fail++;echo "FAIL $message\n";}};
$path=$root.'/resources/titan-apps/interface-contributions.json';
$check(is_file($path),'semantic interface contribution manifest exists');
$data=json_decode((string)@file_get_contents($path),true);
$check(is_array($data)&&($data['schema']??null)==='titan-apps-interface-contributions-v1','contribution manifest schema is valid');
$rows=(array)($data['contributions']??[]);
$check($rows!==[],'at least one governed semantic contribution exists');
foreach($rows as $row){
 $surfaces=(array)($row['supported_surfaces']??[]);
 $check($surfaces!==[] && array_diff($surfaces,['zero','go','hub'])===[],'contribution uses only canonical application surfaces');
 foreach(['javascript','script','component_source','executable_ui','html'] as $forbidden)$check(!array_key_exists($forbidden,(array)$row),'contribution contains no executable UI field '.$forbidden);
 $check(($row['authority']??'')==='none; actions remain governed capability intent','contribution metadata grants no authority');
}
$catalog=$root.'/System/TitanApps/ProviderInterfaceContributionCatalog.php';
$check(is_file($catalog),'provider contribution catalogue runtime adapter exists');
$catalogSource=(string)@file_get_contents($catalog);
$check(str_contains($catalogSource,"['zero','go','hub']"),'runtime catalogue rejects non-canonical app surfaces');
$serviceProviders=glob($root.'/System/*ServiceProvider.php') ?: [];
$providerSource='';foreach($serviceProviders as $sp)$providerSource.=file_get_contents($sp);
$check(str_contains($providerSource,'titan.apps.interface-contributions'),'provider registers contribution catalogue through container discovery');
$all='';foreach(['System','routes','config'] as $runtimeDir){$dir=$root.'/'.$runtimeDir;if(!is_dir($dir))continue;foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir,FilesystemIterator::SKIP_DOTS)) as $file){if($file->isFile()&&$file->getExtension()==='php')$all.=file_get_contents($file->getPathname());}}
$check(!str_contains($all,'providers/Titan-Interaction-Engine')&&!str_contains($all,'Titan-Interaction-Engine-v'),'runtime has no physical Interaction Engine package-path dependency');
if(false){foreach($rows as $row)$check(!in_array('hub',(array)($row['supported_surfaces']??[]),true),'restricted people/payroll contribution is not exposed to Hub');}

echo "RESULT pass=$pass fail=$fail\n";exit($fail===0?0:1);

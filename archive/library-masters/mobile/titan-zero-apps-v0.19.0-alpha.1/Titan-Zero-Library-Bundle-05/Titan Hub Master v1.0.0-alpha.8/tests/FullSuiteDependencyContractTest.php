<?php
$root=dirname(__DIR__);
$suite=dirname($root);
$manifest=json_decode(file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
function fsd(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
$required=[];foreach(($manifest['dependencies']['required']??[]) as $d)$required[$d['key']]=$d['version']??'*';
$expected=[
 'titan-apps-core'=>'TitanAppsCore',
 'interaction-engine'=>'InteractionEngine',
 'titan-interface-runtime'=>'TitanInterfaceRuntime',
 'titan-builder'=>'TitanBuilder',
 'titan-visual-runtime'=>'TitanVisualRuntime',
];
foreach($expected as $key=>$folder){
 $other=json_decode(file_get_contents($suite.'/'.$folder.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
 $actual=$other['key']??$other['slug']??null;
 fsd($actual===$key,"suite manifest identity matches {$key}");
 fsd(array_key_exists($key,$required),"Hub requires canonical suite dependency {$key}");
}
fsd(!array_key_exists('titan-interaction-engine',$required),'native manifest uses Interaction Engine canonical key');
$compat=json_decode(file_get_contents($root.'/extension.json'),true,512,JSON_THROW_ON_ERROR);
$compatSlugs=array_column($compat['dependencies']??[],'slug');
fsd(in_array('titan-interaction-engine',$compatSlugs,true),'compatibility manifest retains legacy Interaction Engine slug');

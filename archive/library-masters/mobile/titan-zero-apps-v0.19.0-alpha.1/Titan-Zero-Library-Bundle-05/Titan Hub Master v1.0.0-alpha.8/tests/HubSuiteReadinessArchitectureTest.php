<?php
$root=dirname(__DIR__);
$file=$root.'/System/Integration/HubSuiteReadiness.php';
function hsr(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
hsr(is_file($file),'suite readiness service exists');
$s=is_file($file)?file_get_contents($file):'';
foreach([
 'TitanAppsApplicationRegistry','AppSurface','PublicInteractionEngineInterface','CapabilityIntentGatewayInterface',
 'TitanInterfaceRuntime\\\\System\\\\Contracts\\\\InterfaceRuntime','TitanBuilder\\\\System\\\\Contracts\\\\ComponentRegistry',
 'TitanBuilder\\\\System\\\\Contracts\\\\TemplateRegistry','TitanBuilder\\\\System\\\\Contracts\\\\SurfaceRegistry',
 'TitanVisualRuntime\\\\System\\\\Contracts\\\\VisualRuntime'
] as $needle) hsr(str_contains($s,$needle),'readiness checks '.$needle);
hsr(str_contains($s,"AppSurface::Hub"),'Core canonical Hub registration is verified');
$health=file_get_contents($root.'/System/Health/HubHealthCheck.php');
hsr(str_contains($health,'HubSuiteReadiness'),'health exposes suite readiness');
hsr(str_contains($s,"'ready'"),'suite readiness exposes aggregate readiness');
hsr(str_contains($health,"['ready']"),'health status consumes aggregate suite readiness');

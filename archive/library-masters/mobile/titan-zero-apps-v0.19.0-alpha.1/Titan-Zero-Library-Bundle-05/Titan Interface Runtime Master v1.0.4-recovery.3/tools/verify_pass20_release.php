<?php

declare(strict_types=1);
$root=dirname(__DIR__);
function r20(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$manifest=json_decode(file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
$extension=json_decode(file_get_contents($root.'/extension.json'),true,512,JSON_THROW_ON_ERROR);
$provider=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$uninstall=file_get_contents($root.'/docs/UNINSTALL.md');
$upgrade=file_get_contents($root.'/docs/UPGRADE.md');
$audit=json_decode(file_get_contents($root.'/DONOR-AUDIT.json'),true,512,JSON_THROW_ON_ERROR);
r20(is_string($manifest['version']??null) && version_compare($manifest['version'],'1.0.0','>=' ) && version_compare($manifest['version'],'2.0.0','<'),'Final manifest version must remain in the v1 release line.');
r20(($extension['version']??null)===($manifest['version']??null),'Installer and canonical manifest versions must match.');
r20(($manifest['database']['migrations']??true)===false,'v1.0 must remain migration-free.');
r20(str_contains($provider,'app(TitanHostMenuCompatibilityAdapter::class)->remove()'),'Uninstall must remove only the runtime menu projection.');
r20(str_contains($uninstall,'must never delete authoritative business data'),'Uninstall runbook must preserve authoritative business data.');
r20(str_contains($upgrade,'v1.0.0'),'Upgrade runbook must include the v1.0 cutover.');
r20(count($audit['donors']??[])===5,'Final donor audit must cover all five supplied donor extensions.');
r20(is_file($root.'/docs/DONOR-RATIONALIZATION.md')&&is_file($root.'/docs/E2E-CERTIFICATION.md')&&is_file($root.'/docs/MIGRATION-GUIDE-v1.md'),'Final release documentation is incomplete.');
r20(!str_contains(strtolower(file_get_contents($root.'/docs/DONOR-RATIONALIZATION.md')),'interface runtime owns wizard'),'Interface Runtime may not claim wizard authority.');
echo "PASS 20 RELEASE: v1.0 versioning, donor audit, migration/uninstall safety and final release documentation are present\n";

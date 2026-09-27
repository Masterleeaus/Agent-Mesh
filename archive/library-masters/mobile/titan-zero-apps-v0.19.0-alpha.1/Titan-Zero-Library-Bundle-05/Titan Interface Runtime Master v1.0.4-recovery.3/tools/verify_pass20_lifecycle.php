<?php

declare(strict_types=1);
$root=dirname(__DIR__);
function l20(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
$provider=file_get_contents($root.'/System/TitanInterfaceRuntimeServiceProvider.php');
$manifest=json_decode(file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
$config=file_get_contents($root.'/config/titan-interface-runtime.php');
$upgrade=file_get_contents($root.'/docs/UPGRADE.md');
$uninstall=file_get_contents($root.'/docs/UNINSTALL.md');
l20(strpos($provider,'$this->registerRoutes();') < strpos($provider,'acceptsTraffic()'),'Diagnostic routes must register before disable/maintenance traffic gating.');
l20(str_contains($provider,'if (! $this->app->make(RuntimeOperationalState::class)->acceptsTraffic())'),'Boot must stop before discovery/menu projection when runtime traffic is disabled.');
l20(str_contains($provider,'app(TitanHostMenuCompatibilityAdapter::class)->remove()'),'Uninstall must remove the runtime menu projection.');
l20(!str_contains(substr($provider,strpos($provider,'public static function uninstall()')),"->table('"),'Uninstall must not delete domain tables.');
l20(($manifest['database']['migrations']??true)===false,'Final release must be migration-free.');
l20(($manifest['lifecycle']['supports_disable']??false)===true,'Disable lifecycle support must remain declared.');
l20(($manifest['data']['default_uninstall_policy']??null)==='retain','Uninstall policy must retain source data.');
l20(str_contains($config,"'kill_switch' => false")&&str_contains($config,"'maintenance_state' => 'ACTIVE'"),'Kill-switch/maintenance controls must remain configured.');
l20(str_contains($upgrade,'v1.0.0')&&str_contains($uninstall,'authoritative business data'),'v1 upgrade/uninstall runbooks must document safe cutover/retention.');
echo "PASS 20 LIFECYCLE: disable gating, migration-free upgrade and retain-data uninstall boundaries are mechanically verified\n";

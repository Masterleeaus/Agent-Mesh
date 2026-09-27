<?php

declare(strict_types=1);

$root=dirname(__DIR__);$errors=[];
$installer=json_decode((string)file_get_contents($root.'/extension.json'),true,flags:JSON_THROW_ON_ERROR);
$sidecar=json_decode((string)file_get_contents($root.'/extension.manifest.json'),true,flags:JSON_THROW_ON_ERROR);
if(version_compare((string)($sidecar['version']??'0'),'2.0.0-beta.1.13','<'))$errors[]='Pass 15 requires beta.1.13-or-later';
$schema=json_decode((string)file_get_contents($root.'/database/schema-contract.json'),true,flags:JSON_THROW_ON_ERROR);
if(($installer['schema']??null)!=='titan-extension-v1')$errors[]='live installer schema changed';
if(!is_string($installer['version']??null)||!is_string($sidecar['version']??null)||!hash_equals((string)$installer['version'],(string)$sidecar['version'])||version_compare((string)$installer['version'],'2.0.0-beta.1.9','<'))$errors[]='beta.1.9-or-later version mismatch';
$source=(string)file_get_contents($root.'/Services/MapsCapabilityService.php');
preg_match_all("/definition\('([^']+)'/", $source, $m);$defined=$m[1]??[];$declared=$sidecar['capabilities']??[];
sort($defined);sort($declared);if($defined!==$declared)$errors[]='capability definitions and sidecar differ';
if(count($defined)!==44)$errors[]='expected 44 capability definitions';
$tables=array_keys($schema);$owned=$sidecar['database']['owned_tables']??[];sort($tables);sort($owned);if($tables!==$owned)$errors[]='schema-contract and sidecar owned tables differ';
if(count($tables)!==39)$errors[]='expected 39 owned tables';
if(count(glob($root.'/database/migrations/*.php')?:[])!==54)$errors[]='expected 54 migrations';
foreach(['maps.quota.status','maps.provider.quota.override','maps.provider.health','maps.dispatch.weights.read','maps.dispatch.weights.update'] as $id)if(!in_array($id,$defined,true))$errors[]="missing beta capability {$id}";
foreach(['titan-maps-intelligence.provider-quota.read','titan-maps-intelligence.provider-quota.override','titan-maps-intelligence.dispatch.weights.read','titan-maps-intelligence.dispatch.weights.update','titan-maps-intelligence.provider-health.read'] as $p)if(!in_array($p,$sidecar['permissions']??[],true))$errors[]="missing beta permission {$p}";
$provider=(string)file_get_contents($root.'/System/TitanMapsIntelligenceServiceProvider.php');
if(!str_contains($provider,"titan-maps:process-geofences --minutes=5")||!str_contains($provider,'everyMinute'))$errors[]='server geofence reconciliation schedule missing';
if(!is_file($root.'/Jobs/RunTerritoryAnalyticsJob.php'))$errors[]='queued territory analytics job missing';
if(!is_file($root.'/Models/MapGeocodeRetryState.php'))$errors[]='geocode retry state missing';
if(!is_file($root.'/docs/audits/2026-08-12-beta1-hardening-disposition.md'))$errors[]='hardening disposition missing';
foreach(['routes/user.php','routes/api.php'] as $routeFile){$r=(string)file_get_contents($root.'/'.$routeFile);if(str_contains($r,'withoutMiddleware'))$errors[]="middleware bypass present in {$routeFile}";}
if($errors){fwrite(STDERR,"Beta.1 release contract FAILED\n - ".implode("\n - ",$errors)."\n");exit(1);}echo "Beta.1 release contract: PASS\n";

<?php
$root = realpath(__DIR__.'/../..');

$config = file_get_contents($root.'/config/titan-apps-core.php');
foreach (["'zero'","'go'","'hub'"] as $surface) assert(str_contains($config, $surface));
assert(str_contains($config, "'interface_mount'=>'zero-workspace'"));
assert(str_contains($config, "'interface_mount'=>'go-workspace'"));
assert(str_contains($config, "'interface_mount'=>'hub-workspace'"));
assert(str_contains($config, "'queue_persistence_owned_here'=>false") === false); // policy belongs in service, not config.

$pwa = file_get_contents($root.'/System/Services/TitanAppsPwaLifecycleService.php');
assert(str_contains($pwa, "'queue_persistence_owned_here'=>false"));
assert(str_contains($pwa, "'service_worker_authority'=>'host/shared PWA runtime'"));

$audience = file_get_contents($root.'/System/Services/AppSurfaceAudienceResolver.php');
assert(str_contains($audience, "AppSurface::Zero => 'business'"));
assert(str_contains($audience, "AppSurface::Go => 'worker'"));
assert(str_contains($audience, "AppSurface::Hub => 'customer'"));

$aliases = json_decode(file_get_contents($root.'/compatibility-aliases.json'), true, flags: JSON_THROW_ON_ERROR);
assert($aliases['surface_aliases']['command'] === 'zero');
assert($aliases['surface_aliases']['field'] === 'go');
assert($aliases['surface_aliases']['customer'] === 'hub');

echo "core_application_registry_contract: ok\n";

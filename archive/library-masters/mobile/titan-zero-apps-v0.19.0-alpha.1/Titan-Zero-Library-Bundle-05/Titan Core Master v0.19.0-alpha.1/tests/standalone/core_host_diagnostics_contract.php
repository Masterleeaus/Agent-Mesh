<?php
$root=realpath(__DIR__.'/../..');

$s=file_get_contents($root.'/System/Services/TitanAppsHostDiagnosticsService.php');
assert(str_contains($s,"'ownership_boundary_not_isolation'=>true"));
assert(str_contains($s,"'package_path_is_authority'=>false"));
assert(str_contains($s,'missingRequired()'));

$provider=file_get_contents($root.'/System/TitanAppsCoreServiceProvider.php');
assert(str_contains($provider,'TitanAppsHostDiagnosticsService'));

echo "core_host_diagnostics_contract: ok\n";

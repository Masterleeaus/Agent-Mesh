<?php
$root = realpath(__DIR__.'/../..');

$contract = file_get_contents($root.'/public-contracts.json');
$data = json_decode($contract, true, flags: JSON_THROW_ON_ERROR);
assert($data['ownership_boundary_not_isolation'] === true);
foreach (['core','interaction-engine','interface-runtime','builder','visual-runtime'] as $service) {
    assert(($data['services'][$service]['platform_accessible'] ?? false) === true);
}

$config = file_get_contents($root.'/config/titan-apps-core.php');
assert(str_contains($config, "'public_services'"));
assert(str_contains($config, "'owner'=>'Titan Apps: Interface Runtime'"));
assert(str_contains($config, "'owner'=>'Titan Apps: Visual Runtime'"));

echo "core_public_access_contract: ok\n";

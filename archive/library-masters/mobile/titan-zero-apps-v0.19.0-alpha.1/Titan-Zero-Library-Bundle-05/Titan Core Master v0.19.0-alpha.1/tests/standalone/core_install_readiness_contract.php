<?php
$root=realpath(__DIR__.'/../..');
$l=json_decode(file_get_contents($root.'/lifecycle.json'),true,flags:JSON_THROW_ON_ERROR);
assert($l['install']['migrations']===false);
assert($l['uninstall']['destructive']===false);
$p=json_decode(file_get_contents($root.'/runtime-contract-policy.json'),true,flags:JSON_THROW_ON_ERROR);
assert(str_contains($p['rule'],'public contract'));
echo "core_install_readiness_contract: ok\n";

<?php
$root=realpath(__DIR__.'/../..');
$d=json_decode(file_get_contents($root.'/agent4-runtime-convergence.json'),true,flags:JSON_THROW_ON_ERROR);
assert($d['visual_runtime']['version']==='1.6.0');
assert($d['builder']['version']==='0.9.6');
assert($d['visual_runtime']['platform_accessible']===true);
$v=json_decode(file_get_contents($root.'/verified-runtime-contracts.json'),true,flags:JSON_THROW_ON_ERROR);
assert(in_array('App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',$v['contracts']['visual-runtime'],true));
echo "core_agent4_runtime_convergence_contract: ok\n";

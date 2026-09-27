<?php
$root=realpath(__DIR__.'/../..');

$v=json_decode(file_get_contents($root.'/verified-runtime-contracts.json'),true,flags:JSON_THROW_ON_ERROR);
assert($v['contracts']['interaction-engine'][0]==='App\\Extensions\\InteractionEngine\\System\\Contracts\\PublicInteractionEngineInterface');
assert(in_array('App\\Extensions\\InteractionEngine\\System\\Contracts\\CapabilityIntentGatewayInterface',$v['contracts']['interaction-engine'],true));
assert(in_array('App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime',$v['contracts']['interface-runtime'],true));
assert(in_array('App\\Extensions\\TitanBuilder\\System\\Contracts\\ComponentRegistry',$v['contracts']['builder'],true));
assert(in_array('App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime',$v['contracts']['visual-runtime'],true));
assert(in_array('App\\Extensions\\TitanHub\\System\\Contracts\\HubPresentationBridge',$v['contracts']['hub'],true));

$r=json_decode(file_get_contents($root.'/suite-requirements.json'),true,flags:JSON_THROW_ON_ERROR);
assert($r['shared_services']['interaction-engine']['canonical_key']==='titan-apps-interaction-engine');
assert($r['shared_services']['interaction-engine']['current_compatibility_key']==='titan-interaction-engine');
assert($r['shared_services']['interface-runtime']['verified_current_contract']==='App\\Extensions\\TitanInterfaceRuntime\\System\\Contracts\\InterfaceRuntime');
assert($r['shared_services']['visual-runtime']['verified_current_contract']==='App\\Extensions\\TitanVisualRuntime\\System\\Contracts\\VisualRuntime');

echo "core_verified_runtime_contract: ok\n";

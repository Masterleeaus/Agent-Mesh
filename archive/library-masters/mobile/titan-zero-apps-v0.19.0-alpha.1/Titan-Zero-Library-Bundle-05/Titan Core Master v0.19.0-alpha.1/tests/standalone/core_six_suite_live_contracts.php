<?php
$root=realpath(__DIR__.'/../..');
$c=file_get_contents($root.'/config/titan-apps-core.php');
assert(str_contains($c,'PublicInteractionEngineInterface'));
assert(str_contains($c,'PresentationIntentPlannerInterface'));
assert(str_contains($c,"'builder' => ["));
assert(str_contains($c,"'required'=>false"));
assert(str_contains($c,'App\\\\Extensions\\\\TitanVisualRuntime\\\\System\\\\Contracts\\\\VisualRuntime'));
assert(!str_contains($c,'VisualRuntimeContract'));
assert(!str_contains($c,'VisualCapabilityRegistryContract'));
$i=json_decode(file_get_contents($root.'/package-identities.json'),true,flags:JSON_THROW_ON_ERROR);
assert(in_array('titan-go',$i['canonical_components']['go']['accepted_package_slugs'],true));
assert(in_array('titan-interaction-engine',$i['canonical_components']['interaction-engine']['accepted_package_slugs'],true));
assert(in_array('titan-visual-runtime',$i['canonical_components']['visual-runtime']['accepted_package_slugs'],true));
echo "core_six_suite_live_contracts: ok\n";

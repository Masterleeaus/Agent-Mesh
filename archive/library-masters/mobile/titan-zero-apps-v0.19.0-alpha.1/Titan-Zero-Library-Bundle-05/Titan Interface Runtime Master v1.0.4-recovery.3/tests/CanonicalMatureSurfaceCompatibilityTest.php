<?php
$root=realpath(__DIR__.'/..');
require_once $root.'/System/Surface/MatureProductSurfaceCompatibility.php';
use App\Extensions\TitanInterfaceRuntime\System\Surface\MatureProductSurfaceCompatibility;
$c=new MatureProductSurfaceCompatibility();
assert($c->resolve('zero',null)==='command');
assert($c->resolve('zero','onboarding')==='onboarding');
assert($c->resolve('go',null)==='go');
assert($c->resolve('hub',null)==='hub');
try{$c->resolve('worker',null);assert(false);}catch(InvalidArgumentException $e){}
echo "CanonicalMatureSurfaceCompatibilityTest: ok\n";

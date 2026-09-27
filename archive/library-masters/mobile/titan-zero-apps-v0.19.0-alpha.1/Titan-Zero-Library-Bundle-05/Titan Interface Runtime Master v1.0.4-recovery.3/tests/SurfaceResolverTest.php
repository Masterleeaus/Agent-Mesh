<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Surface\CanonicalSurfaceResolver;
$r=new CanonicalSurfaceResolver(); ok($r->resolve('command')->surface==='zero','command aliases zero'); ok($r->resolve('customer')->surface==='hub','customer aliases hub'); $o=$r->resolve('onboarding'); ok($o->surface==='zero'&&$o->journey==='onboarding','onboarding is zero journey');

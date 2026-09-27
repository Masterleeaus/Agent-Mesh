<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Security\ProjectionGuard; use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;
$g=new ProjectionGuard(); try{$g->assertContext(new InterfaceContext('hub',null,1,2,[],['customer_safe'=>false]));ok(false,'unsafe hub projection rejected');}catch(RuntimeException){ok(true,'unsafe hub projection rejected');} $g->assertContext(new InterfaceContext('hub',null,1,2,[],['customer_safe'=>true])); ok(true,'customer-safe hub projection accepted');

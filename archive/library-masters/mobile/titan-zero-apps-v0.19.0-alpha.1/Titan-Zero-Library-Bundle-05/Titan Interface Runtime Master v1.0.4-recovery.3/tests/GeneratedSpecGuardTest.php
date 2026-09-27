<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Security\GeneratedSpecGuard;
$g=new GeneratedSpecGuard(); $g->assertSafe(['component'=>'titan.card','props'=>['title'=>'OK']]); ok(true,'safe spec accepted'); try{$g->assertSafe(['component'=>'x','javascript'=>'eval(foo)']);ok(false,'unsafe rejected');}catch(InvalidArgumentException){ok(true,'arbitrary executable UI rejected');}

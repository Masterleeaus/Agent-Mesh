<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Runtime\SemanticInterfaceRuntime;
use App\Extensions\TitanInterfaceRuntime\System\Security\{GeneratedSpecGuard,ProjectionGuard};
use App\Extensions\TitanInterfaceRuntime\System\Catalogue\FallbackBuilderCatalogue;
use App\Extensions\TitanInterfaceRuntime\System\Visual\PassThroughVisualRuntimeBridge;
use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;
$r=new SemanticInterfaceRuntime(new GeneratedSpecGuard(),new ProjectionGuard(),new FallbackBuilderCatalogue(),new PassThroughVisualRuntimeBridge());
try{$r->execute(['component'=>'titan.card'],new InterfaceContext('customer',null,1,2,[],['customer_safe'=>false]));ok(false,'customer alias cannot bypass Hub projection guard');}catch(RuntimeException){ok(true,'customer alias cannot bypass Hub projection guard');}

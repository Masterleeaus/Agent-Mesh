<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Runtime\SemanticInterfaceRuntime;
use App\Extensions\TitanInterfaceRuntime\System\Security\{GeneratedSpecGuard,ProjectionGuard};
use App\Extensions\TitanInterfaceRuntime\System\Catalogue\FallbackBuilderCatalogue;
use App\Extensions\TitanInterfaceRuntime\System\Visual\PassThroughVisualRuntimeBridge;
use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Registry\SemanticInterfaceContributionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Contribution\ArrayInterfaceContribution;
$registry=new SemanticInterfaceContributionRegistry();
$registry->register(new ArrayInterfaceContribution('crm.customer.summary',['surfaces'=>['hub'],'customer_safe'=>true,'definition'=>['component'=>'titan.card','props'=>['title'=>'Customer']]]));
$r=new SemanticInterfaceRuntime(new GeneratedSpecGuard(),new ProjectionGuard(),new FallbackBuilderCatalogue(),new PassThroughVisualRuntimeBridge(),null,$registry);
$out=$r->execute(['contribution'=>'crm.customer.summary','props'=>['subtitle'=>'Current']],new InterfaceContext('hub',null,1,2,[],['customer_safe'=>true]));
ok($out->tree['component']==='titan.card','registered provider contribution executes');
ok(($out->tree['props']['title']??null)==='Customer'&&($out->tree['props']['subtitle']??null)==='Current','safe overrides merge into contribution');
try{$r->execute(['contribution'=>'crm.customer.summary'],new InterfaceContext('zero',null,1,2));ok(false,'surface restriction enforced');}catch(RuntimeException){ok(true,'surface restriction enforced');}

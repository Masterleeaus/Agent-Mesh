<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationIntentAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Surface\CanonicalSurfaceResolver;
use App\Extensions\TitanInterfaceRuntime\System\Security\ProjectionGuard;
use App\Extensions\TitanInterfaceRuntime\System\Value\InterfaceContext;

$a=new PresentationIntentAdapter(new CanonicalSurfaceResolver());
$c=$a->context(['surface'=>'hub','tenant_company_id'=>7,'projection'=>['customer_safe'=>true,'tenant_scoped'=>true]]);
ok($c->companyId===7,'legacy tenant_company_id resolves to canonical company_id context');
try{$a->context(['company_id'=>7,'tenant_company_id'=>8]);ok(false,'conflicting legacy company boundary rejected');}catch(InvalidArgumentException){ok(true,'conflicting legacy company boundary rejected');}
try{$a->context(['tenant_company_id'=>7,'tenant_id'=>8]);ok(false,'conflicting legacy tenant inputs rejected');}catch(InvalidArgumentException){ok(true,'conflicting legacy tenant inputs rejected');}
$g=new ProjectionGuard();
try{$g->assertContext(new InterfaceContext('zero',null,null,2,[],['company_scoped'=>true]));ok(false,'company-scoped projection requires company_id');}catch(RuntimeException){ok(true,'company-scoped projection requires company_id');}
$g->assertContext(new InterfaceContext('zero',null,7,2,[],['tenant_scoped'=>true]));
ok(true,'legacy tenant_scoped metadata maps to company_id requirement only');

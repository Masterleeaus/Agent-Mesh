<?php

declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(static function(string $class)use($root):void{$prefix='App\\Extensions\\TitanInterfaceRuntime\\';if(!str_starts_with($class,$prefix))return;$path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php';if(is_file($path))require_once $path;});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Navigation\RegistryNavigationProjector;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicyProjector;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;

function e20(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}

$domainsSpec=[
 ['crm','CRM',['command','hub'],['crm.customer']],
 ['work','Work',['command','go'],['work.job']],
 ['finance','Finance',['command','hub'],['finance.invoice']],
 ['connect','Connect',['command','hub'],['connect.thread']],
 ['maps','Maps',['command','go'],['maps.location']],
];
$domains=[];$objects=[];$views=[];$actions=[];
foreach($domainsSpec as [$key,$label,$surfaces,$objectKey]){
 $obj=$objectKey[0];
 $domains[]=['key'=>$key,'label'=>$label,'layer'=>'business','product_surfaces'=>$surfaces,'intent_surfaces'=>['home','work','data'],'object_refs'=>[$obj],'default_view_refs'=>[$obj.'.summary'],'priority'=>10];
 $customerSafe=in_array('hub',$surfaces,true);
 $objects[]=['key'=>$obj,'label'=>$label.' object','data_authority'=>$key,'scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>$surfaces,'customer_safe'=>$customerSafe,'permissions'=>[$key.'.view'],'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>[$obj.'.summary'],'action_refs'=>[$obj.'.open'],'relationship_refs'=>[],'offline_mode'=>'read-only'];
 $views[]=['key'=>$obj.'.summary','label'=>'Summary','kind'=>'cards','applies_to'=>[$obj],'product_surfaces'=>$surfaces,'customer_safe'=>$customerSafe,'permissions'=>[$key.'.view'],'data_source'=>['authority'=>$key,'mode'=>'read-model','reference'=>$key.'.summary'],'component_hint'=>'entity-card'];
 $actions[]=['key'=>$obj.'.open','label'=>'Open','applies_to'=>[$obj],'mutating'=>false,'capability_ref'=>null,'interaction'=>null,'product_surfaces'=>$surfaces,'permissions'=>[$key.'.view'],'offline_mode'=>'read-only','requires_confirmation'=>false,'container_hint'=>'drawer','customer_safe'=>$customerSafe];
}
$contrib=['e2e'=>['schema_version'=>'1.1','domains'=>$domains,'objects'=>$objects,'relationships'=>[],'facets'=>[],'views'=>$views,'actions'=>$actions]];
$d=new InMemoryDomainRegistry();$d->rebuild($contrib);$o=new InMemoryObjectRegistry();$o->rebuild($contrib);$f=new InMemoryFacetRegistry($o);$f->rebuild($contrib);$v=new InMemoryViewRegistry($o);$v->rebuild($contrib);$a=new InMemoryActionRegistry($o);$a->rebuild($contrib);
$projector=new ProductSurfacePolicyProjector(new ProductSurfacePolicy(),$d,$o,$f,$v,$a);
$allCaps=['crm.view','work.view','finance.view','connect.view','maps.view'];
$command=$projector->project(new InterfaceContext(7,1,'command','crm',capabilities:$allCaps));
$hub=$projector->project(new InterfaceContext(7,2,'hub','crm',capabilities:$allCaps));
$go=$projector->project(new InterfaceContext(7,3,'go','work',capabilities:$allCaps));
$nav=(new RegistryNavigationProjector($d))->project('command','crm','home');

e20(count($nav->items)===5,'Command navigation must compose CRM, Work, Finance, Connect and Maps in one registry projection.');
e20($command->objects===['connect.thread','crm.customer','finance.invoice','maps.location','work.job'],'Command E2E object projection is incomplete or nondeterministic.');
e20($hub->objects===['connect.thread','crm.customer','finance.invoice'],'Hub must only expose declared customer-safe CRM/Finance/Connect objects.');
e20($go->objects===['maps.location','work.job'],'Go must only expose declared Work/Maps objects.');
foreach($command->actions as $perObject){foreach(array_merge($perObject['primary'],$perObject['secondary']) as $ref){e20(is_string($ref)&&$ref!=='','Action projections must be references only.');}}

echo "PASS 20 E2E: CRM/Work/Finance/Connect/Maps compose through one context/registry policy while Hub and Go remain correctly bounded\n";

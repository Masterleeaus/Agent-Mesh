<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix='App\\Extensions\\TitanInterfaceRuntime\\'; if(!str_starts_with($class,$prefix))return;
    $path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php'; if(is_file($path))require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicyProjector;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;

function e18(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}

$contrib=['demo'=>[
 'schema_version'=>'1.1',
 'domains'=>[['key'=>'crm','label'=>'CRM','layer'=>'business','product_surfaces'=>['command','go','hub','onboarding'],'intent_surfaces'=>['home','work','data'],'object_refs'=>['crm.customer'],'default_view_refs'=>[],'priority'=>1]],
 'objects'=>[['key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command','go','hub','onboarding'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'lifecycle_ref'=>null,'facet_refs'=>['crm.summary','field.notes'],'view_refs'=>['crm.owner-ledger','crm.portal-summary'],'action_refs'=>['crm.owner-writeoff','field.arrive','portal.update'],'relationship_refs'=>[],'offline_mode'=>'read-only']],
 'relationships'=>[],
 'facets'=>[
  ['key'=>'crm.summary','label'=>'Summary','kind'=>'summary','applies_to'=>['crm.customer'],'container'=>'card','product_surfaces'=>['command','hub','onboarding'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'renderer_hint'=>'entity-card'],
  ['key'=>'field.notes','label'=>'Field Notes','kind'=>'notes','applies_to'=>['crm.customer'],'container'=>'panel','product_surfaces'=>['go'],'customer_safe'=>false,'permissions'=>['jobs.work.execute'],'renderer_hint'=>'panel'],
 ],
 'views'=>[
  ['key'=>'crm.owner-ledger','label'=>'Owner Ledger','kind'=>'table','applies_to'=>['crm.customer'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['crm.customer.manage'],'data_source'=>['authority'=>'crm','mode'=>'read-model','reference'=>'owner-ledger'],'component_hint'=>'table'],
  ['key'=>'crm.portal-summary','label'=>'Portal Summary','kind'=>'cards','applies_to'=>['crm.customer'],'product_surfaces'=>['hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'data_source'=>['authority'=>'crm','mode'=>'read-model','reference'=>'portal-summary'],'component_hint'=>'entity-card'],
 ],
 'actions'=>[
  ['key'=>'crm.owner-writeoff','label'=>'Write off','applies_to'=>['crm.customer'],'mutating'=>true,'capability_ref'=>'crm.customer.writeoff','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['crm.customer.manage'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'modal','customer_safe'=>false],
  ['key'=>'field.arrive','label'=>'Arrive','applies_to'=>['crm.customer'],'mutating'=>true,'capability_ref'=>'jobs.work.execute','interaction'=>null,'product_surfaces'=>['go'],'permissions'=>['jobs.work.execute'],'offline_mode'=>'queueable','requires_confirmation'=>false,'container_hint'=>'card','customer_safe'=>false],
  ['key'=>'portal.update','label'=>'Update Contact','applies_to'=>['crm.customer'],'mutating'=>true,'capability_ref'=>'portal.customer.update','interaction'=>null,'product_surfaces'=>['hub'],'permissions'=>['portal.customer.update'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'wizard','customer_safe'=>true],
 ],
]];
$domains=new InMemoryDomainRegistry();$domains->rebuild($contrib);
$objects=new InMemoryObjectRegistry();$objects->rebuild($contrib);
$facets=new InMemoryFacetRegistry($objects);$facets->rebuild($contrib);
$views=new InMemoryViewRegistry($objects);$views->rebuild($contrib);
$actions=new InMemoryActionRegistry($objects);$actions->rebuild($contrib);
$projector=new ProductSurfacePolicyProjector(new ProductSurfacePolicy(),$domains,$objects,$facets,$views,$actions);

$command=$projector->project(new InterfaceContext(7,1,'command','crm',capabilities:['crm.customer.view','crm.customer.manage']));
$go=$projector->project(new InterfaceContext(7,2,'go','crm',capabilities:['crm.customer.view','jobs.work.execute']));
$hub=$projector->project(new InterfaceContext(7,3,'hub','crm',capabilities:['crm.customer.view','portal.customer.update']));
$onboarding=$projector->project(new InterfaceContext(7,4,'onboarding','crm',capabilities:['crm.customer.view']));

e18(in_array('crm.owner-writeoff',$command->actions['crm.customer']['primary'],true),'Command owner action missing.');
e18(!in_array('field.arrive',$command->actions['crm.customer']['primary'],true),'Worker action leaked to Command.');
e18(in_array('field.arrive',$go->actions['crm.customer']['primary'],true),'Go worker action missing.');
e18(!in_array('crm.owner-writeoff',$go->actions['crm.customer']['primary'],true),'Owner action leaked to Go.');
e18(in_array('portal.update',$hub->actions['crm.customer']['primary'],true),'Hub safe action missing.');
e18(!in_array('crm.owner-writeoff',$hub->actions['crm.customer']['primary'],true),'Owner action leaked to Hub.');
e18($hub->views['crm.customer']===['crm.portal-summary'],'Owner view leaked into Hub.');
e18($go->facets['crm.customer']===['field.notes'],'Non-worker facet leaked into Go.');
e18($onboarding->profile->progressiveDisclosure && $onboarding->profile->maxPrimaryActions===3,'Onboarding progressive action budget missing.');
e18($go->profile->density==='compact' && $go->profile->mobileFirst,'Go compact mobile profile missing.');
echo "PASS 18 MATRIX: cross-surface object/view/facet/action filtering and presentation policies are deterministic\n";

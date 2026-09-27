<?php

declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(static function(string $class) use($root):void{$prefix='App\\Extensions\\TitanInterfaceRuntime\\';if(!str_starts_with($class,$prefix))return;$p=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php';if(is_file($p))require_once$p;});

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\InMemoryReadCache;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadAuthorityRouter;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationLifecycleWorkspaceComposer;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Authority\ReadAuthorityAdapterContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryViewRegistry;

function e17(bool $ok,string $m):void{if(!$ok)throw new RuntimeException($m);} 
$con=['builder'=>['schema_version'=>'1.1','objects'=>[['key'=>'builder.page','label'=>'Page','data_authority'=>'titan-builder','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['builder.page.view'],'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>['builder.page.configuration'],'action_refs'=>['builder.preview','builder.validate','builder.publish','builder.rollback'],'relationship_refs'=>[],'offline_mode'=>'read-only']],'relationships'=>[],
'views'=>[['key'=>'builder.page.configuration','label'=>'Config','kind'=>'canvas','applies_to'=>['builder.page'],'product_surfaces'=>['command'],'customer_safe'=>false,'permissions'=>['builder.page.view'],'data_source'=>['authority'=>'titan-builder','mode'=>'read-model','reference'=>'page.configuration-lifecycle'],'component_hint'=>'configuration-lifecycle']],
'actions'=>[
['key'=>'builder.preview','label'=>'Preview','applies_to'=>['builder.page'],'mutating'=>false,'capability_ref'=>'builder.preview','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.page.view'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'full-workspace','customer_safe'=>false],
['key'=>'builder.validate','label'=>'Validate','applies_to'=>['builder.page'],'mutating'=>false,'capability_ref'=>'builder.validate','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.page.view'],'offline_mode'=>'online-required','requires_confirmation'=>false,'container_hint'=>'panel','customer_safe'=>false],
['key'=>'builder.publish','label'=>'Publish','applies_to'=>['builder.page'],'mutating'=>true,'capability_ref'=>'builder.publish','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.publish'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'modal','customer_safe'=>false],
['key'=>'builder.rollback','label'=>'Rollback','applies_to'=>['builder.page'],'mutating'=>true,'capability_ref'=>'builder.rollback','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['builder.publish'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'modal','customer_safe'=>false],
]]];
$objects=new InMemoryObjectRegistry();$objects->rebuild($con);$views=new InMemoryViewRegistry($objects);$views->rebuild($con);$actions=new InMemoryActionRegistry($objects);$actions->rebuild($con);
$adapter=new class implements ReadAuthorityAdapterContract{public function supports(string$a,string$m):bool{return$a==='titan-builder'&&$m==='read-model';}public function read(InterfaceContext$c,string$a,string$r,array$criteria=[]):AuthorityReadResult{return new AuthorityReadResult($a,$r,['status'=>'validated','current_version'=>['id'=>'v3','label'=>'Draft v3','state'=>'draft'],'published_version'=>['id'=>'v2','label'=>'Published v2','state'=>'published'],'preview'=>['available'=>true,'source_ref'=>'preview:v3','html'=>'secret'],'validation'=>['status'=>'valid','errors'=>[],'warnings'=>[]],'history'=>[['id'=>'v3','label'=>'Draft v3','state'=>'draft'],['id'=>'v2','label'=>'Published v2','state'=>'published']],'rollback'=>['available'=>true,'target_version_id'=>'v2'],'action_refs'=>['preview'=>'builder.preview','validate'=>'builder.validate','publish'=>'builder.publish','rollback'=>'builder.rollback'],'configuration'=>['secret'=>'must-not-cross']],['source'=>'builder']);}};
$reader=new AuthorizedViewReader($views,new ReadAuthorityRouter([$adapter],new InMemoryReadCache()));$presentation=new BuilderPresentationAdapter(new ArrayComponentVocabulary(['stack'=>['authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]]]),new PresentationComponentPolicy());
$composer=new ConfigurationLifecycleWorkspaceComposer($objects,$views,$actions,$reader,$presentation);$ctx=new InterfaceContext(7,11,'command','platform',capabilities:['builder.page.view','builder.publish'],traceId:'t17',correlationId:'c17');
$s=$composer->open(ObjectReference::tenant('builder.page',7,'P1'),$ctx,new ReadQuery());
e17($s->status==='validated','status lost');e17(count($s->actionIntents)===4,'expected four governed handoffs');foreach($s->actionIntents as$i)e17(($i['executable']??true)===false,'configuration actions must not become executable locally');e17(!str_contains(json_encode($s,JSON_THROW_ON_ERROR),'must-not-cross'),'raw configuration leaked');e17(($s->policy['version_authority']??null)==='source-extension','source extension must own versions');
try{$composer->open(ObjectReference::tenant('builder.page',8,'P1'),$ctx,new ReadQuery());throw new RuntimeException('cross-tenant reference must fail');}catch(Throwable $e){e17(str_contains(strtolower($e->getMessage()),'unauthorized')||str_contains(strtolower($e->getMessage()),'tenant'),'cross-tenant error should identify authorization/tenant');}
echo "PASS 17 WORKSPACE: Draft/Preview/Validate/Publish/History/Rollback is source-owned, tenant-safe and handoff-only\n";

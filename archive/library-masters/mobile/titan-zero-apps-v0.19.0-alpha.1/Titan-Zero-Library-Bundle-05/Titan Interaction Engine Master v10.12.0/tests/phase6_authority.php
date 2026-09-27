<?php
declare(strict_types=1);
$root=dirname(__DIR__);
if(!function_exists('config')){function config(string $key,mixed $default=null):mixed{return $default;}}
spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Policy\PolicyEngine;
use App\Extensions\InteractionEngine\System\Authority\{ApprovalSigner,AuthorityLevel,CapabilityPolicy};
$fail=0;$check=function(bool$c,string$m)use(&$fail){echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$signer=new ApprovalSigner('phase6-authority-secret-12345');$p=new PolicyEngine($signer);
$ctx=['_context'=>['company_id'=>'c1','company_id'=>'c1','user_id'=>'u1','actor_id'=>'u1','actor_type'=>'human','roles'=>['owner'],'delegated_scopes'=>[],'authenticated_at'=>time()]];
foreach([AuthorityLevel::ObserveOnly,AuthorityLevel::RecommendOnly,AuthorityLevel::PrepareOnly] as$l){$cap='test.'.$l->value;$p->registerCapabilityPolicy(new CapabilityPolicy($cap,$l));$d=$p->decide($cap,$ctx);$check(!$d->allowed,"{$l->value} cannot execute");}
$p->registerCapabilityPolicy(new CapabilityPolicy('test.approval',AuthorityLevel::ApprovalRequired,requiredRoles:['owner']));$check(!$p->decide('test.approval',$ctx)->allowed,'approval_required rejects missing approval');$grant=$signer->issue('test.approval','c1','u1',['owner'],600,'resource-1');$with=$ctx;$with['_approval']=$grant;$check($p->decide('test.approval',$with)->allowed,'approval_required accepts valid scoped approval');
$p->registerCapabilityPolicy(new CapabilityPolicy('test.approval.fresh',AuthorityLevel::ApprovalRequired,requiredRoles:['owner'],freshAuthenticationSeconds:300));
$freshGrant=$signer->issue('test.approval.fresh','c1','u1',['owner'],600,'resource-2');$fresh=$ctx;$fresh['_approval']=$freshGrant;$fresh['_context']['authenticated_at']=0;
$check(!$p->decide('test.approval.fresh',$fresh)->allowed,'approval_required enforces fresh authentication when configured');$fresh['_context']['authenticated_at']=time();$check($p->decide('test.approval.fresh',$fresh)->allowed,'approval_required accepts fresh authenticated scoped approval');
$p->registerCapabilityPolicy(new CapabilityPolicy('test.delegated',AuthorityLevel::DelegatedAutonomous,delegatedScopes:['crm.work_order.create']));$check(!$p->decide('test.delegated',$ctx)->allowed,'delegated_autonomous requires delegated scope even for human actor');$deleg=$ctx;$deleg['_context']['delegated_scopes']=['crm.work_order.create'];$check($p->decide('test.delegated',$deleg)->allowed,'delegated_autonomous accepts required delegated scope');
$p->registerCapabilityPolicy(new CapabilityPolicy('test.user',AuthorityLevel::UserOnly,requiredRoles:['owner'],freshAuthenticationSeconds:300));$check($p->decide('test.user',$ctx)->allowed,'user_only accepts proper role and fresh authentication');$bad=$ctx;$bad['_context']['roles']=['worker'];$check(!$p->decide('test.user',$bad)->allowed,'user_only rejects wrong role');

// CommandBus must surface prepare_only as a prepared outcome without executing the handler.
$preparePolicy=new PolicyEngine($signer);$preparePolicy->registerCapabilityPolicy(new CapabilityPolicy('test.prepare.bus',AuthorityLevel::PrepareOnly));
$events=new class implements App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface{public array$events=[];public function record(string$eventType,array$data):void{$this->events[]=$eventType;}public function getEvents(int$runId):array{return[];}};
$state=new App\Extensions\InteractionEngine\System\Lifecycle\ExtensionState();
$bus=new App\Extensions\InteractionEngine\System\Command\CommandBus($preparePolicy,$events,$state);
$executed=false;$bus->registerHandler('test.prepare.bus',function(array$payload)use(&$executed){$executed=true;return['ok'=>true];});
$prepared=$bus->dispatchResult('test.prepare.bus',$ctx);
$check($prepared->status==='prepared','prepare_only produces prepared result');
$check($executed===false,'prepare_only does not execute handler');


// Controlled legacy aliases must inherit the canonical capability authority, not create a second policy namespace.
$aliasPolicy=new PolicyEngine($signer);$aliasPolicy->registerCapabilityPolicy(new CapabilityPolicy('crm.work_order.complete',AuthorityLevel::UserOnly,requiredRoles:['field_worker']));
$aliasGateway=new class implements App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmCapabilityGatewayInterface{
    public array $calls=[];
    public function supportedCapabilities():array{return ['crm.work_order.complete'];}
    public function available(string $capability,App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext $context):bool{return true;}
    public function execute(string $capability,array $payload,App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext $context):array{$this->calls[]=$capability;return ['status'=>'executed'];}
    public function readiness(App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext $context):array{return ['status'=>'ready'];}
};
$providerRegistry=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry();$providerRegistry->register(new App\Extensions\InteractionEngine\System\Capabilities\Providers\CrmCapabilityProvider($aliasGateway));
$router=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter($providerRegistry,new App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry());
$aliasBus=new App\Extensions\InteractionEngine\System\Command\CommandBus($aliasPolicy,$events,$state,capabilityRouter:$router);
$aliasPayload=['_context'=>['company_id'=>'c1','company_id'=>'c1','user_id'=>'field-1','actor_id'=>'field-1','actor_type'=>'human','roles'=>['field_worker'],'authenticated_at'=>time(),'source_surface'=>'go','correlation_id'=>'corr-alias']];
$aliasResult=$aliasBus->dispatchResult('jobs.complete',$aliasPayload);
$check($aliasResult->status==='executed','legacy capability alias executes under canonical authority policy');
$check(($aliasGateway->calls[0]??null)==='crm.work_order.complete','legacy capability alias reaches only the canonical provider handler');

$readDescriptor=App\Extensions\InteractionEngine\System\Capabilities\Providers\DescriptorFactory::read('crm.customer.read','crm');
$check($readDescriptor->authorityLevel==='user_only','read capabilities require verified user authority rather than non-executable recommend-only authority');

$fieldController=(string)file_get_contents($root.'/System/Http/Controllers/FieldServicesOnboardingController.php');
$fieldRoutes=(string)file_get_contents($root.'/routes/api.php');
$executorSource=(string)file_get_contents($root.'/System/Onboarding/OnboardingActionExecutor.php');
$check(!str_contains($fieldController,'approved_action_ids'),'field-services compatibility API does not accept client approval booleans/action IDs as authorization');
$check(str_contains($fieldRoutes,'/onboarding/field-services/plans/{planId}/approve'),'field-services compatibility API exposes a dedicated server-signed approval endpoint');
$check(!str_contains($executorSource,"array_fill_keys(array_map('strval',\$approvedActionIds)"),'onboarding executor does not mint approvals from caller-provided action IDs');

exit($fail?1:0);

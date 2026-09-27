<?php
declare(strict_types=1);
$root=dirname(__DIR__);
spl_autoload_register(static function(string$class)use($root):void{$p='App\\Extensions\\InteractionEngine\\System\\';if(str_starts_with($class,$p)){$f=$root.'/System/'.str_replace('\\','/',substr($class,strlen($p))).'.php';if(is_file($f))require_once$f;}});
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry;
use App\Extensions\InteractionEngine\System\Capabilities\Contracts\{CrmCapabilityGatewayInterface,BuilderCapabilityGatewayInterface,ChatbotCapabilityGatewayInterface,ConnectCapabilityGatewayInterface,MobileCapabilityGatewayInterface,TitanAICapabilityGatewayInterface};
use App\Extensions\InteractionEngine\System\Capabilities\Providers\{CrmCapabilityProvider,BuilderCapabilityProvider,ChatbotCapabilityProvider,ConnectCapabilityProvider,MobileCapabilityProvider,TitanAICapabilityProvider};
$fail=0;$n=0;$check=function(bool$c,string$m)use(&$fail,&$n){$n++;echo($c?'PASS ':'FAIL ').$m."\n";if(!$c)$fail++;};
$gateway=new class implements CrmCapabilityGatewayInterface,BuilderCapabilityGatewayInterface,ChatbotCapabilityGatewayInterface,ConnectCapabilityGatewayInterface,MobileCapabilityGatewayInterface,TitanAICapabilityGatewayInterface{
    public array $calls=[];
    public function supportedCapabilities():array{return['crm.customer.create','builder.preview','chatbot.identity.update','communications.customer.send','mobile.application.readiness','ai.authority.update'];}
    public function available(string$c,CapabilityExecutionContext$x):bool{return in_array($c,$this->supportedCapabilities(),true)&&$x->companyId==='company-a';}
    public function execute(string$c,array$p,CapabilityExecutionContext$x):array{$this->calls[]=['capability'=>$c,'company_id'=>$x->companyId,'actor_id'=>$x->actorId,'surface'=>$x->sourceSurface,'correlation_id'=>$x->correlationId,'payload'=>$p];return['status'=>'executed','data'=>['capability'=>$c]];}
    public function readiness(CapabilityExecutionContext$x):array{return['status'=>$x->companyId==='company-a'?'ready':'blocked','details'=>['company_id'=>$x->companyId]];}
};
$r=new CapabilityProviderRegistry();
foreach([new CrmCapabilityProvider($gateway),new BuilderCapabilityProvider($gateway),new ChatbotCapabilityProvider($gateway),new ConnectCapabilityProvider($gateway),new MobileCapabilityProvider($gateway),new TitanAICapabilityProvider($gateway)] as$p)$r->register($p);
$router=new CapabilityRouter($r,new CapabilityAliasRegistry());$ctx=new CapabilityExecutionContext('company-a','actor-7','human',['owner'],['crm.customer.create'],'onboarding','corr-1',wizardId:'field_home_services_onboarding_v1',sessionId:'s1',idempotencyKey:'idem-1');
$expected=['crm.customer.create'=>'crm','builder.preview'=>'builder','chatbot.identity.update'=>'chatbot','communications.customer.send'=>'connect','mobile.application.readiness'=>'mobile','ai.authority.update'=>'titan_ai'];
foreach($expected as$cap=>$provider){$res=$router->execute($cap,['_context'=>['company_id'=>'evil'],'safe'=>'value'],$ctx);$check($res->status==='executed'&&$res->provider===$provider,"{$cap} routes to {$provider}");$call=end($gateway->calls);$check(($call['company_id']??'')==='company-a'&&($call['actor_id']??'')==='actor-7',"{$cap} propagates trusted company/actor context");$check(!isset($call['payload']['_context']),"{$cap} strips caller execution context from provider payload");}
$wrong=new CapabilityExecutionContext('company-b','actor-7','human',['owner'],[],'api','corr-2');$check($router->execute('crm.customer.create',[],$wrong)->status==='unavailable','wrong/unavailable company fails closed at provider availability');
$check($router->execute('missing.capability',[],$ctx)->status==='unavailable','unknown capability fails closed');
$unbound=new CapabilityProviderRegistry();$unbound->register(new CrmCapabilityProvider());$unboundRouter=new CapabilityRouter($unbound,new CapabilityAliasRegistry());$check($unboundRouter->execute('crm.customer.create',[],$ctx)->status==='unavailable','declared capability with missing gateway is unavailable');
$throwingGateway=new class implements CrmCapabilityGatewayInterface{
    public function supportedCapabilities():array{return ['crm.customer.create'];}
    public function available(string $capability,CapabilityExecutionContext $context):bool{return true;}
    public function execute(string $capability,array $payload,CapabilityExecutionContext $context):array{throw new RuntimeException('provider secret token fixture-provider-secret-must-not-leak');}
    public function readiness(CapabilityExecutionContext $context):array{return ['status'=>'ready'];}
};
$throwingRegistry=new CapabilityProviderRegistry();$throwingRegistry->register(new CrmCapabilityProvider($throwingGateway));
$throwingRouter=new CapabilityRouter($throwingRegistry,new CapabilityAliasRegistry());$failed=$throwingRouter->execute('crm.customer.create',[],$ctx);
$check($failed->status==='failed'&&!str_contains((string)$failed->reason,'fixture-provider-secret-must-not-leak'),'provider exceptions fail without leaking provider exception details');
$providerSource=(string)file_get_contents($root.'/System/InteractionEngineServiceProvider.php');
$check(!str_contains($providerSource,'MobileCapabilityRegistry'),'global MobileCapabilityRegistry is not misrepresented as company-scoped mobile.application.readiness');
$builderAdapter=(string)file_get_contents($root.'/System/Capabilities/Integrations/BuilderCurrentGatewayAdapter.php');
$check(str_contains($builderAdapter,'ctype_digit($context->companyId)'),'Builder publish/rollback adapter guards the verified integer company contract');
echo"\n".($n-$fail)."/{$n} provider-routing checks passed\n";exit($fail?1:0);

<?php

declare(strict_types=1);
$root=dirname(__DIR__);$engineRoot=$argv[1]??'';
if($engineRoot===''||!is_dir($engineRoot)){fwrite(STDERR,"Usage: php verify_pass9_interaction_snapshot.php /path/to/InteractionEngine\n");exit(2);}
spl_autoload_register(static function(string $class)use($root,$engineRoot):void{
    $maps=['App\\Extensions\\TitanInterfaceRuntime\\'=>$root.'/','App\\Extensions\\InteractionEngine\\'=>rtrim($engineRoot,'/').'/'];
    foreach($maps as$prefix=>$base){if(!str_starts_with($class,$prefix))continue;$rel=str_replace('\\','/',substr($class,strlen($prefix)));$path=$base.$rel.'.php';if(is_file($path))require_once$path;return;}
});
use App\Extensions\InteractionEngine\System\Presentation\GeneratedUiPresenter;
use App\Extensions\InteractionEngine\System\Wizard\Renderer\ArrayRenderer;
use App\Extensions\InteractionEngine\System\Wizard\Renderer\ConversationalRenderer;
use App\Extensions\InteractionEngine\System\Wizard\Renderer\HybridRenderer;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardSessionAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Storage\InMemoryWizardSessionStore;
use App\Extensions\InteractionEngine\System\Wizard\WizardDefinition;
use App\Extensions\InteractionEngine\System\Wizard\WizardSession;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionAdapterException;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\TitanInteractionEngineGateway;
$definition=new WizardDefinition(id:'job_checklist_v1',version:'1.0.0',name:'Job checklist',capability:'jobs.complete_checklist',steps:[['id'=>'checklist','title'=>'Checklist','prompt'=>'Complete required items','fields'=>[['id'=>'items','type'=>'checklist_builder','label'=>'Items','required'=>true]]]],offline:['mode'=>'offline_queueable']);
$session=new WizardSession('session-pass9',$definition,0,['secret_answer'=>'must-not-cross'],['company_id'=>'7','user_id'=>'11','source_surface'=>'field'],'in_progress',[]);
$sessions=new InMemoryWizardSessionStore();$sessions->put($session);
$services=['App\\Extensions\\InteractionEngine\\System\\Wizard\\Storage\\WizardSessionStoreInterface'=>$sessions,'App\\Extensions\\InteractionEngine\\System\\Wizard\\Security\\WizardSessionAccessPolicy'=>new WizardSessionAccessPolicy(),'App\\Extensions\\InteractionEngine\\System\\Wizard\\Renderer\\HybridRenderer'=>new HybridRenderer(new ArrayRenderer(),new ConversationalRenderer(),new GeneratedUiPresenter())];
$container=new class($services){public function __construct(private array $s){}public function bound(string $k):bool{return isset($this->s[$k]);}public function make(string $k):object{return $this->s[$k]??throw new RuntimeException('missing '.$k);}};
$gateway=new TitanInteractionEngineGateway($container);
$context=new InterfaceContext(7,11,'go','work',roles:['worker'],traceId:'trace-ie',correlationId:'corr-ie');
$snapshot=$gateway->session($context,'session-pass9');$j=$snapshot->jsonSerialize();
$checks=[$gateway->available()===true=>'gateway unavailable against current contracts',$snapshot->wizardId==='job_checklist_v1'=>'wizard id mismatch',($snapshot->interaction['offline_mode']??null)==='offline_queueable'=>'offline classification mismatch',($snapshot->provenance['engine_surface']??null)==='field'=>'Go surface did not map to field',($snapshot->provenance['company_id']??null)===7=>'canonical company_id provenance missing',!array_key_exists('data',$j)=>'wizard data crossed adapter boundary',!str_contains(json_encode($j,JSON_THROW_ON_ERROR),'secret_answer')=>'secret wizard answer leaked',($j['interaction']['actions'][0]['executable']??true)===false=>'generated action became executable'];
foreach($checks as $ok=>$msg){if(!$ok){fwrite(STDERR,"FAIL: {$msg}\n");exit(1);}}
$denied=false;try{$gateway->session(new InterfaceContext(8,11,'go','work'),'session-pass9');}catch(InteractionAdapterException){$denied=true;}
if(!$denied){fwrite(STDERR,"FAIL: cross-company interaction session was readable\n");exit(1);}
echo "PASS9_INTERACTION_ENGINE_V1012_COMPAT_OK\n";

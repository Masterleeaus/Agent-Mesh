<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanInterfaceRuntime\\';
    if (! str_starts_with($class, $prefix)) return;
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $path = $root . '/' . $relative . '.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionRenderMode;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\InteractionSnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Interaction\JourneySnapshot;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;

$failures=[];
$check=static function(bool $condition,string $message)use(&$failures):void{if(!$condition)$failures[]=$message;};

$journey = new JourneySnapshot(
    runId:'run-1', journeyId:'field-job-execution', status:'IN_PROGRESS',
    currentWizardId:'job-checklist', wizardSessionId:'session-1',
    progress:['current_index'=>2,'completed'=>2,'total'=>5,'percent'=>40],
    checkpoints:[['wizard_id'=>'arrive','session_id'=>'s0','saved_at'=>100]],
);
$snapshot = new InteractionSnapshot(
    sessionId:'session-1', wizardId:'job-checklist', status:'in_progress',
    message:'Complete the checklist.',
    interaction:[
        'session_id'=>'session-1','wizard_id'=>'job-checklist','step_id'=>'checklist',
        'title'=>'Checklist','prompt'=>'Complete required items','input_type'=>'checklist',
        'validation'=>['items'=>['required'=>true]],'ui_hint'=>'checklist','help_text'=>null,
        'progress'=>['step'=>3,'total'=>6,'percentage'=>50,'status'=>'in_progress'],
        'actions'=>['submit','pause'],'requires_online'=>false,'offline_mode'=>'offline_queueable',
        'authority_state'=>'governed','surface'=>'field','ui_presentation_schema'=>['format'=>'json-tree-v1','layout'=>'full_page_form','responsive'=>true,'executable_content'=>false],
    ],
    structuredStep:['id'=>'checklist','title'=>'Checklist','fields'=>[['id'=>'items','type'=>'checklist_builder','label'=>'Items']]],
    stepIndex:2, updatedAt:1000, expiresAt:2000, journey:$journey,
    provenance:['authority'=>'titan-interaction-engine','access'=>'interaction-engine-policy'],
);

$gateway = new class($snapshot) implements InteractionEngineGatewayContract {
    public function __construct(private InteractionSnapshot $snapshot){}
    public function available(): bool { return true; }
    public function session(InterfaceContext $context,string $sessionId): InteractionSnapshot { if($sessionId!==$this->snapshot->sessionId)throw new RuntimeException('missing');return $this->snapshot; }
    public function health(): array { return ['available'=>true,'source'=>'test']; }
};

$vocab = new ArrayComponentVocabulary([
    'chat-thread'=>['id'=>'chat-thread','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'stack'=>['id'=>'stack','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'form-wizard'=>['id'=>'form-wizard','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
    'progress'=>['id'=>'progress','authority'=>'presentation-only','responsive'=>true,'accessible'=>true,'props'=>[]],
]);
$presenter = new InteractionPresentationAdapter($gateway,new BuilderPresentationAdapter($vocab,new PresentationComponentPolicy()));
$context = new InterfaceContext(7,11,'go','work',journeyId:'field-job-execution',roles:['worker'],capabilities:['jobs.execute'],traceId:'trace-p9',correlationId:'corr-p9');

$chat=$presenter->render($context,'session-1',InteractionRenderMode::CHAT);
$panel=$presenter->render($context,'session-1',InteractionRenderMode::PANEL);
$workspace=$presenter->render($context,'session-1',InteractionRenderMode::FULL_WORKSPACE);
foreach([$chat,$panel,$workspace] as $presentation){
    $serialized=$presentation->jsonSerialize();
    $check(($serialized['session_id']??null)==='session-1','render mode lost persisted session identity');
    $check(($serialized['resume_key']??null)==='session-1','render mode did not preserve resume key');
    $check(($serialized['journey']['journey_id']??null)==='field-job-execution','render mode lost journey state');
    $check(($serialized['tree']['authority']??null)==='presentation-only','interaction rendering gained execution authority');
    $check(($serialized['interaction']['actions'][0]['executable']??true)===false,'interaction action became directly executable');
}
$check($chat->tree->root->type==='chat-thread','chat mode did not map to chat presentation');
$check($panel->tree->root->type==='stack','panel mode did not map to adaptive panel');
$check($workspace->tree->root->type==='form-wizard','full workspace mode did not map to structured wizard');
$check($chat->snapshotFingerprint===$panel->snapshotFingerprint&&$panel->snapshotFingerprint===$workspace->snapshotFingerprint,'same Interaction Engine session produced different source snapshot identity');
$check($workspace->snapshot->interaction['offline_mode']==='offline_queueable','offline classification was not preserved');
$check(!array_key_exists('data',$workspace->snapshot->jsonSerialize()),'accumulated wizard data leaked into Interface Runtime snapshot');

if($failures!==[]){foreach($failures as$f)fwrite(STDERR,"FAIL: {$f}\n");exit(1);}echo "PASS9_INTERACTION_ENGINE_ADAPTER_OK\n";

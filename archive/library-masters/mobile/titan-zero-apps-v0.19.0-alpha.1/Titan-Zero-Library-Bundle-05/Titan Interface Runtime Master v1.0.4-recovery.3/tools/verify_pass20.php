<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix='App\\Extensions\\TitanInterfaceRuntime\\';
    if (! str_starts_with($class,$prefix)) return;
    $path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Experience\AttentionHudProjector;
use App\Extensions\TitanInterfaceRuntime\System\Experience\DonorRationalizationCatalog;
use App\Extensions\TitanInterfaceRuntime\System\Experience\FocusWorkspacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\Experience\GuidanceOverlayProjector;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkItemReference;
use App\Extensions\TitanInterfaceRuntime\System\GlobalWork\GlobalWorkTraySnapshot;

function p20(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}

$context=new InterfaceContext(7,11,'command','crm',workspaceId:'workspace-42',capabilities:['crm.customer.view']);
$focus=(new FocusWorkspacePolicy())->project($context,'object','crm.customer@7:42');
p20($focus->enabled,'Focus workspace must be enabled when explicitly projected.');
p20($focus->preserveGlobalSafetyControls,'Focus mode may not hide approvals/sync/escape safety controls.');
p20($focus->targetReference==='crm.customer@7:42','Focus target must remain a reference, not authoritative data.');

$guidance=(new GuidanceOverlayProjector())->project($context,[
    ['key'=>'welcome','title'=>'Welcome','description'=>'Open the customer workspace.','target_ref'=>'nav.crm.customer','placement'=>'bottom','action_ref'=>'crm.customer.open'],
    ['key'=>'unsafe','title'=>'<b>Unsafe</b>','description'=>'<script>alert(1)</script>','target_ref'=>'bad selector','placement'=>'sideways','raw_html'=>'<b>no</b>'],
]);
p20(count($guidance->steps)===1,'Unsafe coachmark definitions must be omitted fail-closed.');
p20(($guidance->jsonSerialize()['steps'][0]['executable']??true)===false,'Coachmark actions must remain non-executable presentation references.');
p20(!str_contains(json_encode($guidance->jsonSerialize(),JSON_THROW_ON_ERROR),'raw_html'),'Raw HTML must never cross the guidance boundary.');

$item=new GlobalWorkItemReference('attention','invoice-overdue','finance','invoice:88','Invoice overdue',900,1720000000,7,'finance.invoice@7:88',null,'finance.invoice.open',['crm.customer.view'],'Customer invoice requires review.');
$agg=new class($item) implements GlobalWorkTrayAggregatorContract {
    public function __construct(private GlobalWorkItemReference $item){}
    public function aggregate(InterfaceContext $context,string $tray,?int $limit=null): GlobalWorkTraySnapshot {
        if($tray==='attention') return new GlobalWorkTraySnapshot('attention','ready',[$this->item],[]);
        return new GlobalWorkTraySnapshot($tray,'empty',[],[]);
    }
    public function all(InterfaceContext $context,?int $limitPerTray=null): array { return []; }
};
$hud=(new AttentionHudProjector($agg))->project($context);
p20(count($hud->items)===1,'Attention HUD must reuse Global Work references rather than own announcement state.');
p20(($hud->items[0]['executable']??true)===false,'HUD items must remain non-executable.');

$catalog=new DonorRationalizationCatalog();
$decisions=$catalog->all();
p20(($decisions['menu']['decision']??null)==='absorbed','Menu presentation primitive should be absorbed into Interface Runtime.');
p20(($decisions['focus-mode']['decision']??null)==='retire-after-cutover','Focus Mode should retire after Interface Runtime cutover.');
p20(($decisions['introductions']['decision']??null)==='retire','Introductions duplicate tour authority and should retire.');
p20(($decisions['onboarding-pro']['wizard_authority']??true)===false,'Onboarding Pro must not retain wizard/workflow authority.');
p20(($decisions['announcement']['data_authority']??null)==='source-extension','Announcement authoring/data must remain outside Interface Runtime.');

echo "PASS 20 VERIFY: donor primitives are rationalized into safe focus/HUD/guidance presentation without duplicate wizard or data authority\n";

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Command\CommandSurfaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\AttentionHudProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\FocusWorkspacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\GuidanceOverlayProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Offline\OfflineSyncWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ProductSurface\ProductSurfacePolicyProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DomainRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Http\Controllers\Controller;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

final class RuntimeMenuPageController extends Controller
{
    private const PAGES=['explore','commands','continue','attention','approvals','inbox','sync','workspaces','collections','spatial','decisions','governance','working-sets','configuration','experience','surfaces'];

    public function __invoke(
        Request $request,
        string $page,
        InterfaceContextStoreContract $contexts,
        DomainRegistryContract $domains,
        ObjectRegistryContract $objects,
        ViewRegistryContract $views,
        ActionRegistryContract $actions,
        CommandSurfaceContract $commands,
        GlobalWorkTrayAggregatorContract $trays,
        OfflineSyncWorkspaceContract $sync,
        ProductSurfacePolicyProjectorContract $surfaces,
        FocusWorkspacePolicyContract $focus,
        AttentionHudProjectorContract $hud,
        GuidanceOverlayProjectorContract $guidance,
    ): View {
        if(!in_array($page,self::PAGES,true)) abort(404);
        $context=$contexts->requireCurrent();
        $payload=[];
        $title='Titan Interface Runtime';
        $description='Presentation-only runtime workspace.';

        if($page==='explore'){
            $title='Explore Interface';
            $description='Registered domains, objects, views and actions contributed by Titan extensions.';
            $payload=[
                'domains'=>$domains->snapshot()->jsonSerialize(),
                'objects'=>$objects->snapshot()->jsonSerialize(),
                'views'=>$views->snapshot()->jsonSerialize(),
                'actions'=>$actions->snapshot()->jsonSerialize(),
            ];
        } elseif($page==='commands'){
            $title='Command Surface';
            $description='Search registry navigation, the current object context and governed action intents.';
            $query=$request->query('q','');
            if(!is_string($query)) $query='';
            $payload=$commands->search($query,$context,50)->jsonSerialize();
        } elseif(in_array($page,['continue','attention','approvals','inbox'],true)){
            $title=ucfirst($page);
            $description='Global Work references contributed by authoritative Titan extensions.';
            $payload=$trays->aggregate($context,$page,100)->jsonSerialize();
        } elseif($page==='sync'){
            $title='Sync';
            $description='Source-authoritative offline, queue and conflict state. Interface Runtime does not own replay or resolution.';
            $payload=$sync->compose($context,100)->jsonSerialize();
        } elseif($page==='surfaces'){
            $title='Product Surfaces';
            $description='Current Command / Go / Hub / Onboarding presentation policy projection.';
            $payload=$surfaces->project($context)->jsonSerialize();
        } elseif(in_array($page,['workspaces','collections','spatial','decisions','governance','working-sets','configuration'],true)){
            $objectSnapshot=$objects->snapshot()->jsonSerialize();
            $viewSnapshot=$views->snapshot()->jsonSerialize();
            $actionSnapshot=$actions->snapshot()->jsonSerialize();
            $titles=[
                'workspaces'=>'Object Workspaces','collections'=>'Collections','spatial'=>'Spatial','decisions'=>'Decisions',
                'governance'=>'Governance','working-sets'=>'Working Sets','configuration'=>'Configuration',
            ];
            $descriptions=[
                'workspaces'=>'Facet-driven object workspaces. Open a concrete object from its owning extension or Explore surface.',
                'collections'=>'Cards, table, board, calendar, timeline and feed projections over authoritative collection reads.',
                'spatial'=>'Map and spatial presentation backed by source-owned spatial providers such as Titan Maps Intelligence.',
                'decisions'=>'Observation, recommendation, scenario and choice presentation. Decision authority remains source-owned.',
                'governance'=>'Proposal, risk, assurance, approval, execution receipt and rollback presentation. Governance authority remains source-owned.',
                'working-sets'=>'Mixed-object contextual sets for humans and Zero. Membership never grants object permission or ownership.',
                'configuration'=>'Draft, preview, validate, publish, history and rollback presentation for configuration-owning extensions.',
            ];
            $title=$titles[$page];
            $description=$descriptions[$page];
            $payload=[
                'capability'=>$page,
                'objects'=>$objectSnapshot['objects'] ?? [],
                'views'=>$viewSnapshot['views'] ?? [],
                'actions'=>$actionSnapshot['actions'] ?? [],
                'note'=>'This landing page is discovery-only. Concrete object/action routes require an authoritative source reference and remain permission checked.',
            ];
        } else {
            $title='Experience';
            $description='Presentation-only focus, attention HUD and semantic guidance state.';
            $targetReference=$context->workspaceId ?? $context->objectRef ?? 'interface-runtime';
            $payload=[
                'focus'=>$focus->project($context,'workspace',(string)$targetReference)->jsonSerialize(),
                'hud'=>$hud->project($context,8)->jsonSerialize(),
                'guidance'=>$guidance->project($context,(array)config('titan-interface-runtime.experience.guidance_steps',[]))->jsonSerialize(),
            ];
        }

        return view('titan-interface-runtime::menu-page',compact('page','title','description','payload'));
    }
}

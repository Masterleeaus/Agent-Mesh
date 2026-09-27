<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Interaction;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Interaction\InteractionEngineGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

final readonly class InteractionPresentationAdapter
{
    public function __construct(
        private InteractionEngineGatewayContract $gateway,
        private BuilderPresentationAdapter $builder,
    ) {}

    public function render(InterfaceContext $context, string $sessionId, string $mode): InteractionPresentation
    {
        $mode=InteractionRenderMode::normalize($mode);
        $snapshot=$this->gateway->session($context,$sessionId);
        $responsive=ResponsiveHints::required();
        [$hint,$container]=match($mode){
            InteractionRenderMode::CHAT=>['chat-thread','chat'],
            InteractionRenderMode::PANEL=>['stack','panel'],
            InteractionRenderMode::FULL_WORKSPACE=>['form-wizard','full-workspace'],
        };
        $component=$this->builder->resolve($hint,$container,$responsive);
        $props=[
            'interaction_authority'=>'titan-interaction-engine','read_only_projection'=>true,
            'render_mode'=>$mode,'session_id'=>$snapshot->sessionId,'resume_key'=>$snapshot->sessionId,
            'wizard_id'=>$snapshot->wizardId,'status'=>$snapshot->status,'message'=>$snapshot->message,
            'interaction'=>$snapshot->safeInteraction(),'structured_step'=>$snapshot->structuredStep,
            'journey'=>$snapshot->journey?->jsonSerialize(),'resumable'=>$snapshot->resumable(),
        ];
        $root=new PresentationNode($component->componentId,'interaction-'.$mode,$props);
        $tree=new PresentationTree($context->productSurface,$root,$responsive,[
            'source'=>'titan-interaction-engine','session_id'=>$snapshot->sessionId,
            'snapshot_fingerprint'=>$snapshot->fingerprint(),'execution_authority'=>false,
        ]);
        return new InteractionPresentation($mode,$snapshot,$tree,$snapshot->fingerprint());
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Governance;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Receipts\ReceiptPresenterContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

final readonly class GovernanceWorkspaceComposer implements GovernanceWorkspaceContract
{
    public function __construct(
        private ObjectRegistryContract $objects,
        private ActionRegistryContract $actions,
        private GovernanceStateGatewayContract $gateway,
        private BuilderPresentationAdapter $presentation,
        private ?GovernancePayloadNormalizer $normalizer = null,
        private ?GovernanceHandoffResolver $handoffs = null,
        private ?ReceiptPresenterContract $receiptPresenter = null,
    ) {}

    public function open(string $objectReference,string $actionKey,InterfaceContext $context,?string $receiptId=null,?string $approvalId=null):GovernanceWorkspaceSnapshot
    {
        try{$reference=ObjectReference::parse($objectReference);$resolved=$this->objects->resolve($reference,$context);}catch(\Throwable $e){throw new GovernanceWorkspaceException('Governance workspace object reference is unavailable or unauthorized.',0,$e);}
        $action=$this->actions->get($actionKey);
        if($action===null||!in_array($resolved->object->key,$action->appliesTo,true))throw new GovernanceWorkspaceException("Unknown or inapplicable governance action '{$actionKey}'.");
        if(!$action->visibleIn($context))throw new GovernanceWorkspaceException('Action permission or product-surface requirements are not satisfied.');
        if(!$action->mutating)throw new GovernanceWorkspaceException('Governance lifecycle is reserved for protected mutating actions.');
        if($receiptId!==null&&($receiptId===''||strlen($receiptId)>160||preg_match('/[^A-Za-z0-9._:-]/',$receiptId)))throw new GovernanceWorkspaceException('Receipt identifier is invalid.');
        if($approvalId!==null&&($approvalId===''||strlen($approvalId)>160||preg_match('/[^A-Za-z0-9._:-]/',$approvalId)))throw new GovernanceWorkspaceException('Approval identifier is invalid.');

        $normalizer=$this->normalizer??new GovernancePayloadNormalizer();$handoffs=$this->handoffs??new GovernanceHandoffResolver();
        $state=['status'=>'unavailable','proposal'=>[],'risk'=>[],'assurance'=>[],'autonomy'=>[],'approval'=>[],'execution'=>[],'receipt'=>null,'rollback'=>['available'=>false,'status'=>'unavailable'],'provenance'=>[],'handoffs'=>[]];
        $providerStatus='degraded';$diagnostics=[];
        try{
            $result=$this->gateway->inspect($action,$resolved,$context,$receiptId,$approvalId);
            if($result->health->degraded())$providerStatus='degraded';else$providerStatus='ready';
            $state=$normalizer->normalize($result->payload);
            $state['provenance']=array_replace($state['provenance'],$result->provenance,['provider_key'=>$result->providerKey,'provider_health'=>$result->health->jsonSerialize()]);
        }catch(\Throwable $e){$diagnostics=['provider'=>'unavailable','reason'=>'Authoritative governance state is unavailable.'];}
        $actionIntents=$providerStatus==='ready'?$handoffs->resolve($state,$action):[];
        $policy=[
            'governance_calculated_locally'=>false,'risk_calculated_locally'=>false,'assurance_calculated_locally'=>false,'autonomy_calculated_locally'=>false,
            'approval_authority'=>'source-governance','execution_authority'=>'capability-or-interaction-engine','receipt_authority'=>'source-governance',
            'rollback_authority'=>'source-governance','actions_are_handoffs_only'=>true,'auto_execute'=>false,'requires_fresh_governance'=>true,
        ];
        $component=$this->presentation->resolve('approval-card','panel',ResponsiveHints::required());
        $lifecycle=['proposal','risk-assurance-autonomy','approval','execution','receipt','rollback'];
        $children=[];
        if($state['receipt']!==null&&$this->receiptPresenter!==null)$children[]=$this->receiptPresenter->present($state['receipt']);
        $tree=new PresentationTree($context->productSurface,new PresentationNode('component','trust-governance-workspace',[
            'container'=>'panel','component'=>$component->jsonSerialize(),'object_reference'=>$reference->canonical(),'object_key'=>$resolved->object->key,
            'action_key'=>$action->key,'action_label'=>$action->label,'status'=>$state['status'],'provider_status'=>$providerStatus,'lifecycle'=>$lifecycle,
            'proposal'=>$state['proposal'],'risk'=>$state['risk'],'assurance'=>$state['assurance'],'autonomy'=>$state['autonomy'],'approval'=>$state['approval'],
            'execution'=>$state['execution'],'receipt'=>$state['receipt']?->jsonSerialize(),'rollback'=>$state['rollback'],'action_intents'=>$actionIntents,
            'provenance'=>$state['provenance'],'trust_policy'=>$policy,'projection_only'=>true,
        ],$children),ResponsiveHints::required(),['authority'=>'presentation-only','governance_authority'=>'source-engines','actions_are_handoffs_only'=>true,'auto_execute'=>false]);
        return new GovernanceWorkspaceSnapshot($reference->canonical(),$action->key,$state['status'],$providerStatus,$state['proposal'],$state['risk'],$state['assurance'],$state['autonomy'],$state['approval'],$state['execution'],$state['receipt'],$state['rollback'],$actionIntents,$state['provenance'],$policy,$diagnostics,$tree);
    }
}

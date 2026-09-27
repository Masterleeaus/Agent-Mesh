<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Configuration;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Configuration\ConfigurationLifecycleWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;

final readonly class ConfigurationLifecycleWorkspaceComposer implements ConfigurationLifecycleWorkspaceContract
{
    private const OPERATIONS=['preview','validate','publish','rollback'];

    public function __construct(
        private ObjectRegistryContract $objects, private ViewRegistryContract $views, private ActionRegistryContract $actions,
        private AuthorizedViewReader $reader, private BuilderPresentationAdapter $presentation, private ?ConfigurationPayloadNormalizer $normalizer=null,
    ) {}

    public function open(ObjectReference $reference, InterfaceContext $context, ReadQuery $query, ?string $requestedViewKey=null): ConfigurationLifecycleWorkspaceSnapshot
    {
        try{$resolved=$this->objects->resolve($reference,$context);}catch(\Throwable $e){throw new ConfigurationLifecycleWorkspaceException('Configuration object reference is unavailable or unauthorized.',0,$e);}
        foreach($resolved->object->permissions as $permission)if(!$context->hasCapability($permission))throw new ConfigurationLifecycleWorkspaceException('Object permission requirements are not satisfied.');
        if(isset($query->filters['object_id']) && (string)$query->filters['object_id']!==$reference->objectId)throw new ConfigurationLifecycleWorkspaceException('Configuration query object_id does not match the requested object reference.');
        $view=$this->selectView($resolved->object->key,$context,$requestedViewKey);
        if($view->dataMode==='legacy-route')throw new ConfigurationLifecycleWorkspaceException('Configuration lifecycle workspaces require structured read-model or capability data.');
        $filters=$query->filters;$filters['object_id']=$reference->objectId;
        $readQuery=new ReadQuery($filters,$query->sort,$query->page,$query->perPage,$query->cursor,$query->search);
        $result=$this->reader->read($view->key,$context,$readQuery);
        $state=($this->normalizer??new ConfigurationPayloadNormalizer())->normalize($result->data);
        $actionIntents=$this->actionIntents($resolved->object->key,$context,$state);
        $policy=['version_authority'=>'source-extension','preview_authority'=>'source-extension','validation_authority'=>'source-extension','publish_authority'=>'source-extension','rollback_authority'=>'source-extension',
            'interface_runtime_stores_configuration_versions'=>false,'interface_runtime_validates_configuration'=>false,'interface_runtime_publishes_configuration'=>false,'direct_configuration_writes'=>false,'actions_are_handoffs_only'=>true];
        $component=$this->presentation->resolve($view->componentHint,'full-workspace',ResponsiveHints::required());
        $tree=new PresentationTree($context->productSurface,new PresentationNode('component','configuration-lifecycle-workspace',[
            'container'=>'full-workspace','component'=>$component->jsonSerialize(),'object_reference'=>$reference->canonical(),'object_key'=>$resolved->object->key,'view_key'=>$view->key,
            'stages'=>['draft','preview','validate','publish','history','rollback'],'status'=>$state['status'],'current_version'=>$state['current_version'],'published_version'=>$state['published_version'],
            'preview'=>$state['preview'],'validation'=>$state['validation'],'history'=>$state['history'],'rollback'=>$state['rollback'],'action_intents'=>$actionIntents,'provenance'=>$result->provenance,'configuration_policy'=>$policy,'projection_only'=>true,
        ]),ResponsiveHints::required(),['authority'=>'presentation-only','configuration_authority'=>'source-extension','actions_are_handoffs_only'=>true]);
        return new ConfigurationLifecycleWorkspaceSnapshot($reference->canonical(),$resolved->object->key,$view->key,$state['status'],$state['current_version'],$state['published_version'],$state['preview'],$state['validation'],$state['history'],$state['rollback'],$actionIntents,$result->provenance,$policy,$readQuery->fingerprint(),$tree);
    }

    private function selectView(string $objectKey,InterfaceContext $context,?string $requestedViewKey): ViewDescriptor
    {
        $eligible=array_values(array_filter($this->views->forObject($objectKey),static fn(ViewDescriptor $v):bool=>$v->componentHint==='configuration-lifecycle'&&$v->visibleIn($context)));
        usort($eligible,static fn(ViewDescriptor $a,ViewDescriptor $b):int=>[strtolower($a->label),$a->key]<=>[strtolower($b->label),$b->key]);
        if($requestedViewKey!==null){foreach($eligible as $view)if($view->key===$requestedViewKey)return $view;$known=$this->views->find($requestedViewKey);if($known!==null&&$known->componentHint!=='configuration-lifecycle')throw new ConfigurationLifecycleWorkspaceException("View '{$requestedViewKey}' is not a configuration lifecycle view.");throw new ConfigurationLifecycleWorkspaceException("Requested configuration lifecycle view '{$requestedViewKey}' is unavailable or unsafe in this context.");}
        if($eligible===[])throw new ConfigurationLifecycleWorkspaceException("Object '{$objectKey}' has no configuration lifecycle view for the active context.");return $eligible[0];
    }

    /** @param array<string,mixed> $state @return list<array<string,mixed>> */
    private function actionIntents(string $objectKey,InterfaceContext $context,array $state): array
    {
        $out=[];$refs=is_array($state['action_refs']??null)?$state['action_refs']:[];
        foreach(self::OPERATIONS as $operation){$key=$refs[$operation]??null;if(!is_string($key))continue;$action=$this->actions->get($key);if($action===null||!in_array($objectKey,$action->appliesTo,true)||!$action->visibleIn($context))continue;
            if(in_array($operation,['publish','rollback'],true)&&!$action->mutating)continue;
            $intent=['operation'=>$operation,'key'=>$action->key,'label'=>$action->label,'mutating'=>$action->mutating,'capability_ref'=>$action->capabilityRef,'interaction'=>$action->interaction,'requires_confirmation'=>$action->requiresConfirmation,
                'offline_mode'=>$action->offlineMode,'customer_safe'=>$action->customerSafe,'execution_authority'=>$action->interaction!==null?'interaction-engine':'capability','executable'=>false];
            if($operation==='rollback'&&is_string($state['rollback']['target_version_id']??null))$intent['target_version_id']=$state['rollback']['target_version_id'];
            if($operation==='preview'&&is_string($state['preview']['source_ref']??null))$intent['preview_source_ref']=$state['preview']['source_ref'];
            $out[]=$intent;
        }return $out;
    }
}

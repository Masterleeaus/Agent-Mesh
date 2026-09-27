<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetDomainItemVerifierContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

final readonly class WorkingSetWorkspaceComposer implements WorkingSetWorkspaceContract
{
    /** @param array<string,list<string>> $objectTypeMap @param list<string> $userScopedTypes */
    public function __construct(
        private WorkingSetGatewayContract $gateway,
        private WorkingSetDomainItemVerifierContract $domainVerifier,
        private ObjectRegistryContract $objects,
        private BuilderPresentationAdapter $presentation,
        private array $objectTypeMap,
        private array $userScopedTypes,
        private int $maxItems=200,
    ) {}

    public function open(string $workingSetId, InterfaceContext $context): WorkingSetWorkspaceSnapshot
    {
        $source=$this->gateway->inspect($workingSetId,$context);
        if ((string)$source->ownerUserId!==(string)$context->userId) throw new WorkingSetWorkspaceException('Working set user identity does not match the authenticated interface user.');
        if (isset($source->context['business_id']) && (string)$source->context['business_id']!=='' && (string)$source->context['business_id']!==(string)$context->companyId) {
            throw new WorkingSetWorkspaceException('Working set business/tenant context does not match the authenticated interface tenant.');
        }
        $child=$context->with(['workspace_id'=>$source->workingSetId]);
        $items=[];$objectRefs=[];$opaqueRefs=[];$omitted=['unauthorized'=>0,'source_scope'=>0,'unmapped'=>0,'invalid'=>0,'truncated'=>0];
        foreach (array_slice($source->items,0,max(1,$this->maxItems)) as $item) {
            $workspaceItem=$this->authorizeItem($item,$child,$omitted);
            if ($workspaceItem===null) continue;
            $items[]=$workspaceItem;
            if ($workspaceItem->objectReference!==null) $objectRefs[]=$workspaceItem->objectReference;
            else $opaqueRefs[]=$workspaceItem->itemType.':'.$workspaceItem->itemId;
        }
        if (count($source->items)>$this->maxItems) $omitted['truncated']=count($source->items)-$this->maxItems;
        $objectRefs=array_values(array_unique($objectRefs));$opaqueRefs=array_values(array_unique($opaqueRefs));sort($objectRefs,SORT_STRING);sort($opaqueRefs,SORT_STRING);
        $envelope=[
            'version'=>'1.0','working_set_id'=>$source->workingSetId,'source_authority'=>$source->sourceAuthority,'workspace_context'=>$source->context,
            'object_refs'=>$objectRefs,'opaque_item_refs'=>$opaqueRefs,'company_id'=>(string)$child->companyId,'company_id'=>(string)$child->companyId,'user_id'=>(string)$child->userId,
            'product_surface'=>$child->productSurface,'trace_id'=>$child->traceId,'correlation_id'=>$child->correlationId,
            'membership_grants_authorization'=>false,'payloads_included'=>false,
        ];
        $actions=array_map(static fn(WorkingSetWorkspaceItem $item):array=>[
            'operation'=>'detach-membership','working_set_id'=>$source->workingSetId,'membership_id'=>$item->membershipId,'item_type'=>$item->itemType,'item_id'=>$item->itemId,
            'source_authority'=>$source->sourceAuthority,'membership_only'=>true,'deletes_authoritative_data'=>false,'execution_authority'=>$source->sourceAuthority,'executable'=>false,
        ],$items);
        $component=$this->presentation->resolve('stack','full-workspace',ResponsiveHints::required());
        $tree=new PresentationTree($child->productSurface,new PresentationNode('component','working-set-workspace',[
            'container'=>'full-workspace','component'=>$component->jsonSerialize(),'working_set_id'=>$source->workingSetId,'name'=>$source->name,'description'=>$source->description,
            'context_envelope'=>$envelope,'items'=>array_map(static fn(WorkingSetWorkspaceItem $item):array=>$item->jsonSerialize(),$items),'action_intents'=>$actions,
            'membership_is_context_only'=>true,'authoritative_payload_loading'=>false,'membership_removal_deletes_source_data'=>false,
        ]),ResponsiveHints::required(),['authority'=>'presentation-only','working_set_authority'=>$source->sourceAuthority,'shared_context_for_people_and_ai'=>true,'direct_business_writes'=>false]);
        return new WorkingSetWorkspaceSnapshot($source->workingSetId,$source->name,$source->description,$source->sourceAuthority,$child,$items,$envelope,$actions,['source'=>$source->diagnostics,'omitted'=>$omitted],$tree);
    }

    /** @param array<string,int> $omitted */
    private function authorizeItem(WorkingSetSourceItem $item, InterfaceContext $context, array &$omitted): ?WorkingSetWorkspaceItem
    {
        $label=trim((string)($item->title??''));if($label==='')$label=ucwords(str_replace(['-','_'], ' ', $item->itemType));
        if (in_array($item->itemType,$this->userScopedTypes,true)) return new WorkingSetWorkspaceItem($item->membershipId,$item->itemType,$item->itemId,$label,null,$this->safeMeta($item->meta),$item->updatedAt);
        $object=$this->mappedObject($item->itemType);if($object===null){$omitted['unmapped']++;return null;}
        if (! $object->visibleIn($context)){$omitted['unauthorized']++;return null;}
        if (! $this->domainVerifier->verify($item->itemType,$item->itemId,$context)){$omitted['source_scope']++;return null;}
        try {
            $reference=$object->scopeType==='tenant'?ObjectReference::tenant($object->key,$context->companyId,$item->itemId):ObjectReference::global($object->key,$item->itemId);
            $resolved=$this->objects->resolve($reference,$context);
            return new WorkingSetWorkspaceItem($item->membershipId,$item->itemType,$item->itemId,$label,$resolved->reference->canonical(),$this->safeMeta($item->meta),$item->updatedAt);
        } catch (\Throwable) {$omitted['invalid']++;return null;}
    }

    private function mappedObject(string $itemType): ?\App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectDescriptor
    {
        foreach($this->objectTypeMap[$itemType]??[] as$key){$object=$this->objects->get($key);if($object!==null)return$object;}return null;
    }

    /** @param array<string,mixed> $meta @return array<string,mixed> */
    private function safeMeta(array $meta): array
    {
        $out=[];foreach(['source','slug','path','url','mime','size','filename'] as$key){$value=$meta[$key]??null;if(!is_scalar($value)||$value==='')continue;$text=(string)$value;if(strlen($text)>512)continue;if(in_array($key,['url','path'],true)&&preg_match('~^(?:javascript|data|file):~i',$text))continue;$out[$key]=$text;}return$out;
    }
}

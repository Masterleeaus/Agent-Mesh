<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Decision;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorizedViewReader;
use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionProviderGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Decision\DecisionWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DecisionProviderRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ViewRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\DecisionProviderDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;

final readonly class DecisionWorkspaceComposer implements DecisionWorkspaceContract
{
    public function __construct(
        private ObjectRegistryContract $objects,private ViewRegistryContract $views,private ActionRegistryContract $actions,
        private DecisionProviderRegistryContract $providers,private DecisionProviderGatewayContract $gateway,private AuthorizedViewReader $reader,
        private BuilderPresentationAdapter $presentation,private ?DecisionPayloadNormalizer $normalizer=null,
    ){}

    public function open(string $objectKey,InterfaceContext $context,ReadQuery $query,?string $requestedViewKey=null):DecisionWorkspaceSnapshot
    {
        $object=$this->objects->get($objectKey);if($object===null)throw new DecisionWorkspaceException("Unknown or unavailable decision object '{$objectKey}'.");
        if(!$object->visibleIn($context))throw new DecisionWorkspaceException('Object is not safe or visible on the active product surface.');
        foreach($object->permissions as $permission)if(!$context->hasCapability($permission))throw new DecisionWorkspaceException('Object permission requirements are not satisfied.');
        $normalizer=$this->normalizer??new DecisionPayloadNormalizer();$observations=[];$recommendations=[];$scenarios=[];$assumptions=[];$sources=[];$diagnostics=['providers'=>[]];
        $view=$this->selectScenarioView($objectKey,$context,$requestedViewKey);
        if($view!==null){
            if($view->dataMode==='legacy-route')throw new DecisionWorkspaceException('Scenario workspaces require structured read-model or capability data, not legacy routes.');
            $result=$this->reader->read($view->key,$context,$query);$normalized=$normalizer->normalize($result->data);
            $observations=array_merge($observations,$normalized['observations']);$recommendations=array_merge($recommendations,$normalized['recommendations']);$scenarios=array_merge($scenarios,$normalized['scenarios']);$assumptions=array_merge($assumptions,$normalized['assumptions']);
            $sources[]=['kind'=>'scenario-view','key'=>$view->key,'authority'=>$view->dataAuthority,'mode'=>$view->dataMode,'reference'=>$view->dataReference,'provenance'=>$result->provenance];
            if(($normalized['diagnostics']['omitted']??[])!==[])$diagnostics['view']=$normalized['diagnostics'];
        }
        $providerHealth=[];
        foreach($this->providers->forObject($objectKey) as $provider){
            try{$providerResult=$this->gateway->fetch($provider,$context,['query'=>$query->jsonSerialize(),'query_fingerprint'=>$query->fingerprint(),'object_key'=>$objectKey]);$providerHealth[]=$providerResult->health;
                $normalized=$normalizer->normalize($providerResult->payload);$observations=array_merge($observations,$normalized['observations']);$recommendations=array_merge($recommendations,$normalized['recommendations']);$scenarios=array_merge($scenarios,$normalized['scenarios']);$assumptions=array_merge($assumptions,$normalized['assumptions']);
                $sources[]=['kind'=>'decision-provider','key'=>$provider->providerKey(),'source_ref'=>$provider->sourceRef,'provenance'=>$providerResult->provenance];if(($normalized['diagnostics']['omitted']??[])!==[])$diagnostics['providers'][$provider->providerKey()]=$normalized['diagnostics'];
            }catch(\Throwable $e){$providerHealth[]=new DecisionProviderHealth($provider->providerKey(),'unavailable','Provider unavailable.');$diagnostics['providers'][$provider->providerKey()]=['status'=>'unavailable'];}
        }
        if($view===null&&$providerHealth===[])throw new DecisionWorkspaceException("Object '{$objectKey}' has no scenario view or decision provider for the active context.");
        $providerStatus=array_filter($providerHealth,static fn(DecisionProviderHealth $h):bool=>$h->degraded())!==[]?'degraded':($providerHealth===[]?'none':'ready');
        $decisionIntents=$this->decisionIntents($objectKey,$context,$scenarios,$this->providers->forObject($objectKey));
        $policy=['observation_is_not_recommendation'=>true,'recommendation_is_not_execution'=>true,'scenario_is_not_authority'=>true,'auto_execute'=>false,'execution'=>'governed-capability-or-interaction-only'];
        $component=$this->presentation->resolve($view?->componentHint?:'approval-card','panel',ResponsiveHints::required());
        $tree=new PresentationTree($context->productSurface,new PresentationNode('component','decide-scenario-workspace',[
            'container'=>'panel','component'=>$component->jsonSerialize(),'object_key'=>$objectKey,'view_key'=>$view?->key,'query_fingerprint'=>$query->fingerprint(),'layers'=>['observation','recommendation','scenario','choice'],
            'observations'=>$observations,'recommendations'=>$recommendations,'scenarios'=>$scenarios,'assumptions'=>$assumptions,'decision_intents'=>$decisionIntents,'sources'=>$sources,'decision_policy'=>$policy,'projection_only'=>true,
        ]),ResponsiveHints::required(),['authority'=>'presentation-only','decision_authority'=>'source-engines','recommendations_are_advisory'=>true,'actions_are_intents_only'=>true,'auto_execute'=>false]);
        return new DecisionWorkspaceSnapshot($objectKey,$view?->key,(string)$context->companyId,(string)$context->userId,$context->productSurface,$query->fingerprint(),$providerStatus,$observations,$recommendations,$scenarios,$assumptions,$decisionIntents,$sources,$policy,$diagnostics,$tree);
    }

    private function selectScenarioView(string $objectKey,InterfaceContext $context,?string $requestedViewKey):?ViewDescriptor
    {
        $eligible=array_values(array_filter($this->views->forObject($objectKey),static fn(ViewDescriptor $v):bool=>$v->kind==='scenario'&&$v->visibleIn($context)));
        usort($eligible,static fn(ViewDescriptor $a,ViewDescriptor $b):int=>[strtolower($a->label),$a->key]<=>[strtolower($b->label),$b->key]);
        if($requestedViewKey!==null){foreach($eligible as $view)if($view->key===$requestedViewKey)return$view;$known=$this->views->find($requestedViewKey);if($known!==null&&$known->kind!=='scenario')throw new DecisionWorkspaceException("View '{$requestedViewKey}' is not a scenario view.");throw new DecisionWorkspaceException("Requested scenario view '{$requestedViewKey}' is unavailable or unsafe in this context.");}
        return $eligible[0]??null;
    }

    /** @param list<array<string,mixed>> $scenarios @param list<DecisionProviderDescriptor> $providers @return list<array<string,mixed>> */
    private function decisionIntents(string $objectKey,InterfaceContext $context,array $scenarios,array $providers):array
    {
        $allowed=[];foreach($providers as $provider)foreach($provider->actionRefs as $ref)$allowed[$ref]=true;foreach($scenarios as $scenario)if(is_string($scenario['action_ref']??null))$allowed[$scenario['action_ref']]=true;
        $byAction=[];foreach($scenarios as $scenario){$ref=$scenario['action_ref']??null;if(is_string($ref))$byAction[$ref][]=$scenario;}
        $out=[];foreach($this->actions->forObject($objectKey,$context) as $action){if(!isset($allowed[$action->key]))continue;$scenarioKeys=array_values(array_unique(array_map(static fn(array $s):string=>(string)$s['key'],$byAction[$action->key]??[])));$consequences=[];foreach($byAction[$action->key]??[] as $s)foreach($s['consequences']??[] as $c)$consequences[]=$c;$consequences=array_values(array_unique($consequences));
            $out[]=['key'=>$action->key,'label'=>$action->label,'mutating'=>$action->mutating,'capability_ref'=>$action->capabilityRef,'interaction'=>$action->interaction,'requires_confirmation'=>$action->requiresConfirmation,'offline_mode'=>$action->offlineMode,'customer_safe'=>$action->customerSafe,'scenario_refs'=>$scenarioKeys,'consequences'=>$consequences,'execution_authority'=>$action->interaction!==null?'interaction-engine':'capability','executable'=>false];}
        usort($out,static fn(array $a,array $b):int=>[$a['mutating']?1:0,strtolower((string)$a['label']),(string)$a['key']]<=>[$b['mutating']?1:0,strtolower((string)$b['label']),(string)$b['key']]);return$out;
    }
}

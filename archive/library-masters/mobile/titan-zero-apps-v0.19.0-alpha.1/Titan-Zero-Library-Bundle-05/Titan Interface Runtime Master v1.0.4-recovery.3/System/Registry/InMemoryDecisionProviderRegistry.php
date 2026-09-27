<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ActionRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\DecisionProviderRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;

final class InMemoryDecisionProviderRegistry implements DecisionProviderRegistryContract
{
    private DecisionProviderRegistrySnapshot $current;
    public function __construct(private readonly ObjectRegistryContract $objects, private readonly ActionRegistryContract $actions){$this->current=new DecisionProviderRegistrySnapshot();}

    public function rebuild(array $contributions): DecisionProviderRegistrySnapshot
    {
        ksort($contributions,SORT_STRING); $providers=[];$byObject=[];$rejected=[];
        foreach($contributions as $contributorKey=>$contribution){
            try{
                $descriptor=$this->unwrap($contribution);$items=$descriptor['providers']['decisions']??null;
                if(!is_array($items)||!array_is_list($items)) throw new \InvalidArgumentException('providers.decisions must be a list.');
                foreach($items as $raw){
                    if(!is_array($raw)||array_is_list($raw)) throw new \InvalidArgumentException('decision provider entries must be objects.');
                    $provider=DecisionProviderDescriptor::fromArray((string)$contributorKey,$raw);$providerKey=$provider->providerKey();
                    if(isset($providers[$providerKey])) throw new \InvalidArgumentException("duplicate decision provider '{$providerKey}'.");
                    foreach($provider->objectRefs as $objectKey) if($this->objects->get($objectKey)===null) throw new \InvalidArgumentException("decision provider '{$provider->key}' references unavailable object '{$objectKey}'.");
                    foreach($provider->actionRefs as $actionKey) {
                        $action=$this->actions->get($actionKey); if($action===null) throw new \InvalidArgumentException("decision provider '{$provider->key}' references unavailable action '{$actionKey}'.");
                        foreach($provider->objectRefs as $objectKey) if(!in_array($objectKey,$action->appliesTo,true)) throw new \InvalidArgumentException("decision provider '{$provider->key}' action '{$actionKey}' does not apply to '{$objectKey}'.");
                    }
                    $providers[$providerKey]=$provider;foreach($provider->objectRefs as $objectKey)$byObject[$objectKey][]=$providerKey;
                }
            }catch(\Throwable $e){$rejected[(string)$contributorKey][]=$e->getMessage();}
        }
        ksort($providers,SORT_STRING);foreach($byObject as &$keys){sort($keys,SORT_STRING);$keys=array_values(array_unique($keys));}unset($keys);ksort($byObject,SORT_STRING);
        foreach($rejected as &$messages)$messages=array_values(array_unique($messages));unset($messages);ksort($rejected,SORT_STRING);
        return $this->current=new DecisionProviderRegistrySnapshot($providers,$byObject,$rejected);
    }

    public function forObject(string $objectKey): array
    {
        $out=[];foreach($this->current->byObject[$objectKey]??[] as $key){$provider=$this->current->providers[$key]??null;if($provider!==null)$out[]=$provider;}return $out;
    }
    public function snapshot(): DecisionProviderRegistrySnapshot{return $this->current;}
    private function unwrap(array $contribution):array{$descriptor=$contribution['descriptor']??$contribution;if(!is_array($descriptor)||array_is_list($descriptor))throw new \InvalidArgumentException('contribution descriptor must be an object.');return $descriptor;}
}

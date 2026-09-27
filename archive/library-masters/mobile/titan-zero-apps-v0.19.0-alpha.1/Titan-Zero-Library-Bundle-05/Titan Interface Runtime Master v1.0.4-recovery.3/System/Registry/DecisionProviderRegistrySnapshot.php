<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class DecisionProviderRegistrySnapshot implements \JsonSerializable
{
    /** @param array<string,DecisionProviderDescriptor> $providers @param array<string,list<string>> $byObject @param array<string,list<string>> $rejected */
    public function __construct(public array $providers=[], public array $byObject=[], public array $rejected=[]){ }
    public function jsonSerialize(): array
    {
        return ['providers'=>array_map(static fn(DecisionProviderDescriptor $d):array=>$d->jsonSerialize(),$this->providers),'by_object'=>$this->byObject,'rejected'=>$this->rejected,'provider_count'=>count($this->providers)];
    }
}

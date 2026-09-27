<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use JsonSerializable;

final readonly class LegacyDataSurfaceRegistrySnapshot implements JsonSerializable
{
    /** @param array<string, LegacyDataSurfaceDescriptor> $surfaces @param array<string,list<string>> $byObject @param array<string,list<string>> $collisions @param array<string,list<string>> $rejected */
    public function __construct(public array $surfaces, public array $byObject, public array $collisions=[], public array $rejected=[]) {}
    public function jsonSerialize(): array { return ['count'=>count($this->surfaces),'surfaces'=>array_map(static fn($v)=>$v->jsonSerialize(),$this->surfaces),'by_object'=>$this->byObject,'collisions'=>$this->collisions,'rejected'=>$this->rejected]; }
}

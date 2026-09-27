<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Data;

use JsonSerializable;

final readonly class DataModeProjection implements JsonSerializable
{
    /** @param list<DataModeSurface> $surfaces */
    public function __construct(public string $objectKey,public array $surfaces,public array $omitted=[]){ }
    public function jsonSerialize():array{return ['object_key'=>$this->objectKey,'surfaces'=>array_map(static fn($s)=>$s->jsonSerialize(),$this->surfaces),'omitted'=>$this->omitted];}
}

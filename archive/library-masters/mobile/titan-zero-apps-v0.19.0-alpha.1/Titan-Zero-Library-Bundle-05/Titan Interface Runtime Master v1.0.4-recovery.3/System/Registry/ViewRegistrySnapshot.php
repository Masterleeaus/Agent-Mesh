<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use JsonSerializable;

final readonly class ViewRegistrySnapshot implements JsonSerializable
{
    /** @param array<string, ViewDescriptor> $views @param array<string, list<string>> $byObject @param array<string, list<string>> $collisions @param array<string, list<string>> $rejected */
    public function __construct(public array $views, public array $byObject, public array $collisions = [], public array $rejected = []) {}
    public function jsonSerialize(): array
    {
        return [
            'count'=>count($this->views),
            'views'=>array_map(static fn(ViewDescriptor $v)=>$v->jsonSerialize(), $this->views),
            'by_object'=>$this->byObject,'collisions'=>$this->collisions,'rejected'=>$this->rejected,
        ];
    }
}

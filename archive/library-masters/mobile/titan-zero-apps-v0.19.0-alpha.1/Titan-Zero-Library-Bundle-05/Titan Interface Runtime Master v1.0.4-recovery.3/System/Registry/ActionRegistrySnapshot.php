<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class ActionRegistrySnapshot implements \JsonSerializable
{
    /**
     * @param array<string,ActionDescriptor> $actions
     * @param array<string,list<string>> $byObject
     * @param array<string,list<string>> $collisions
     * @param array<string,list<string>> $rejected
     */
    public function __construct(
        public array $actions = [],
        public array $byObject = [],
        public array $collisions = [],
        public array $rejected = [],
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'summary'=>[
                'active_actions'=>count($this->actions),
                'actionable_objects'=>count($this->byObject),
                'collisions'=>count($this->collisions),
                'rejected_contributors'=>count($this->rejected),
            ],
            'actions'=>array_map(static fn(ActionDescriptor $a): array => $a->jsonSerialize(), $this->actions),
            'by_object'=>$this->byObject,
            'collisions'=>$this->collisions,
            'rejected'=>$this->rejected,
        ];
    }
}

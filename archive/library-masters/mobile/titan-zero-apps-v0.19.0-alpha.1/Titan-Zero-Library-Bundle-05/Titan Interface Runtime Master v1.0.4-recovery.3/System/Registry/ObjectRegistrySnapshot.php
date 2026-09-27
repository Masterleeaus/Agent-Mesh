<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class ObjectRegistrySnapshot implements \JsonSerializable
{
    /**
     * @param array<string,ObjectDescriptor> $objects
     * @param array<string,ObjectRelationshipDescriptor> $relationships
     * @param array<string,list<string>> $collisions
     * @param array<string,list<string>> $rejected
     */
    public function __construct(
        public array $objects = [],
        public array $relationships = [],
        public array $collisions = [],
        public array $rejected = [],
    ) {
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'summary' => [
                'active_objects' => count($this->objects),
                'relationships' => count($this->relationships),
                'collisions' => count($this->collisions),
                'rejected_contributors' => count($this->rejected),
            ],
            'objects' => array_map(static fn (ObjectDescriptor $object): array => $object->jsonSerialize(), $this->objects),
            'relationships' => array_map(static fn (ObjectRelationshipDescriptor $relationship): array => $relationship->jsonSerialize(), $this->relationships),
            'collisions' => $this->collisions,
            'rejected' => $this->rejected,
        ];
    }
}

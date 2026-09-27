<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Objects;

use App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectDescriptor;

final readonly class ResolvedObjectReference implements \JsonSerializable
{
    public function __construct(
        public ObjectReference $reference,
        public ObjectDescriptor $object,
    ) {
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'reference' => $this->reference->jsonSerialize(),
            'object' => $this->object->jsonSerialize(),
        ];
    }
}

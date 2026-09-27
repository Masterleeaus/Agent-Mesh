<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

final readonly class WorkingSetWorkspaceItem implements \JsonSerializable
{
    /** @param array<string,mixed> $meta */
    public function __construct(
        public string $membershipId,
        public string $itemType,
        public string $itemId,
        public string $label,
        public ?string $objectReference,
        public array $meta = [],
        public ?string $updatedAt = null,
    ) {}

    public function jsonSerialize(): array
    {
        return ['membership_id'=>$this->membershipId,'item_type'=>$this->itemType,'item_id'=>$this->itemId,'label'=>$this->label,'object_ref'=>$this->objectReference,'meta'=>$this->meta,'updated_at'=>$this->updatedAt];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

final readonly class WorkingSetSourceItem implements \JsonSerializable
{
    /** @param array<string,mixed> $meta */
    public function __construct(
        public string $membershipId,
        public string $itemType,
        public string $itemId,
        public ?string $title = null,
        public array $meta = [],
        public ?string $updatedAt = null,
    ) {
        foreach (['membership_id'=>$membershipId,'item_type'=>$itemType,'item_id'=>$itemId] as $field=>$value) {
            if ($value === '' || strlen($value) > 191 || preg_match('/[\x00-\x1F\x7F]/', $value)) {
                throw new \InvalidArgumentException("{$field} is invalid.");
            }
        }
        if ($title !== null && strlen($title) > 255) throw new \InvalidArgumentException('working-set item title is too long.');
    }

    public function jsonSerialize(): array
    {
        return ['membership_id'=>$this->membershipId,'item_type'=>$this->itemType,'item_id'=>$this->itemId,'title'=>$this->title,'meta'=>$this->meta,'updated_at'=>$this->updatedAt];
    }
}

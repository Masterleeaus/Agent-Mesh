<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

final readonly class WorkingSetSourceResult implements \JsonSerializable
{
    /** @param array<string,mixed> $context @param list<WorkingSetSourceItem> $items @param array<string,mixed> $diagnostics */
    public function __construct(
        public string $sourceAuthority,
        public string $status,
        public string $workingSetId,
        public string $ownerUserId,
        public ?string $teamId,
        public string $name,
        public ?string $description,
        public array $context,
        public array $items,
        public array $diagnostics = [],
    ) {
        if ($sourceAuthority === '' || $workingSetId === '' || $ownerUserId === '' || trim($name) === '') throw new \InvalidArgumentException('working-set source result is incomplete.');
        if (! in_array($status, ['ready','empty','degraded','unavailable'], true)) throw new \InvalidArgumentException('working-set source status is unsupported.');
        foreach ($items as $item) if (! $item instanceof WorkingSetSourceItem) throw new \InvalidArgumentException('working-set source items are invalid.');
    }

    public function jsonSerialize(): array
    {
        return [
            'source_authority'=>$this->sourceAuthority,'status'=>$this->status,'working_set_id'=>$this->workingSetId,'owner_user_id'=>$this->ownerUserId,
            'team_id'=>$this->teamId,'name'=>$this->name,'description'=>$this->description,'context'=>$this->context,
            'items'=>array_map(static fn(WorkingSetSourceItem $item):array=>$item->jsonSerialize(),$this->items),'diagnostics'=>$this->diagnostics,
        ];
    }
}

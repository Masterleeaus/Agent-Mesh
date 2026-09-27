<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Command;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class CommandSurfaceSnapshot implements \JsonSerializable
{
    /** @param list<CommandItem> $items */
    public function __construct(
        public string $query,
        public array $items,
        public int $total,
        public int $limit,
        public bool $truncated,
        public PresentationTree $presentation,
        public string $authority='presentation-only',
    ) {
        if ($authority!=='presentation-only') throw new \InvalidArgumentException('command surface authority must remain presentation-only.');
    }

    public function jsonSerialize(): array
    {
        return [
            'authority'=>$this->authority,
            'query'=>$this->query,
            'total'=>$this->total,
            'limit'=>$this->limit,
            'truncated'=>$this->truncated,
            'items'=>array_map(static fn(CommandItem $i):array=>$i->jsonSerialize(),$this->items),
            'presentation'=>$this->presentation->jsonSerialize(),
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\WorkingSet;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;

final readonly class WorkingSetWorkspaceSnapshot implements \JsonSerializable
{
    /** @param list<WorkingSetWorkspaceItem> $items @param array<string,mixed> $contextEnvelope @param list<array<string,mixed>> $actionIntents @param array<string,mixed> $diagnostics */
    public function __construct(
        public string $workingSetId,
        public string $name,
        public ?string $description,
        public string $sourceAuthority,
        public InterfaceContext $context,
        public array $items,
        public array $contextEnvelope,
        public array $actionIntents,
        public array $diagnostics,
        public PresentationTree $presentation,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'working_set_id'=>$this->workingSetId,'name'=>$this->name,'description'=>$this->description,'source_authority'=>$this->sourceAuthority,
            'context'=>$this->context->jsonSerialize(),'items'=>array_map(static fn(WorkingSetWorkspaceItem $item):array=>$item->jsonSerialize(),$this->items),
            'context_envelope'=>$this->contextEnvelope,'action_intents'=>$this->actionIntents,'diagnostics'=>$this->diagnostics,'presentation'=>$this->presentation->jsonSerialize(),
        ];
    }
}

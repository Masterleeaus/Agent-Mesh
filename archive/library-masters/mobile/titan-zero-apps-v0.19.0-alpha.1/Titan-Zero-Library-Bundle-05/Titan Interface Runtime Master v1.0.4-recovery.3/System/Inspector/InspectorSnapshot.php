<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Inspector;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ResolvedObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspace;

final readonly class InspectorSnapshot implements \JsonSerializable
{
    /** @param list<InspectorActionReference> $actions */
    public function __construct(
        public ResolvedObjectReference $object,
        public InterfaceContext $context,
        public ObjectWorkspace $workspace,
        public array $actions,
        public InspectorTarget $workspaceTarget,
        public PresentationTree $presentation,
    ) {}

    public function jsonSerialize(): array
    {
        return [
            'authority'=>'presentation-only',
            'object'=>$this->object->jsonSerialize(),
            'context'=>$this->context->jsonSerialize(),
            'workspace'=>$this->workspace->jsonSerialize(),
            'actions'=>array_map(static fn(InspectorActionReference $a):array=>$a->jsonSerialize(),$this->actions),
            'workspace_target'=>$this->workspaceTarget->jsonSerialize(),
            'presentation'=>$this->presentation->jsonSerialize(),
        ];
    }
}

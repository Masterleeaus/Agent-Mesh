<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Workspace;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\FacetRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\ObjectRegistryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Workspace\ObjectWorkspaceComposerContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;

final readonly class ObjectWorkspaceComposer implements ObjectWorkspaceComposerContract
{
    public function __construct(
        private ObjectRegistryContract $objects,
        private FacetRegistryContract $facets,
    ) {
    }

    public function compose(ObjectReference $reference, InterfaceContext $context): ObjectWorkspace
    {
        $resolved = $this->objects->resolve($reference, $context);
        foreach ($resolved->object->permissions as $permission) {
            if (! $context->hasCapability($permission)) {
                throw new ObjectWorkspaceCompositionException("Object '{$resolved->object->key}' is not authorized in the current interface context.");
            }
        }

        $slots = [];
        foreach ($this->facets->forObject($resolved->object->key, $context) as $facet) {
            $slots[] = new FacetSlot($facet);
        }

        return new ObjectWorkspace($resolved, $context->productSurface, $slots);
    }
}

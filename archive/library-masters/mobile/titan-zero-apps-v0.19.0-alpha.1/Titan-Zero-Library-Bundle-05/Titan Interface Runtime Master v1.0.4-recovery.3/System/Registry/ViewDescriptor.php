<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use JsonSerializable;

final readonly class ViewDescriptor implements JsonSerializable
{
    /**
     * @param list<string> $appliesTo
     * @param list<string> $productSurfaces
     * @param list<string> $permissions
     */
    public function __construct(
        public string $contributorKey,
        public string $key,
        public string $label,
        public string $kind,
        public array $appliesTo,
        public array $productSurfaces,
        public bool $customerSafe,
        public array $permissions,
        public string $dataAuthority,
        public string $dataMode,
        public string $dataReference,
        public ?string $componentHint = null,
    ) {
    }

    public function visibleOn(string $productSurface): bool
    {
        return in_array($productSurface, $this->productSurfaces, true)
            && ($productSurface !== 'hub' || $this->customerSafe);
    }

    /** @param list<string> $capabilities */
    public function authorizedBy(array $capabilities): bool
    {
        foreach ($this->permissions as $permission) {
            if (! in_array('*', $capabilities, true) && ! in_array($permission, $capabilities, true)) return false;
        }
        return true;
    }

    public function visibleIn(InterfaceContext $context): bool
    {
        return $this->visibleOn($context->productSurface) && $this->authorizedBy($context->capabilities);
    }

    public function jsonSerialize(): array
    {
        return [
            'contributor_key'=>$this->contributorKey,'key'=>$this->key,'label'=>$this->label,'kind'=>$this->kind,
            'applies_to'=>$this->appliesTo,'product_surfaces'=>$this->productSurfaces,'customer_safe'=>$this->customerSafe,
            'permissions'=>$this->permissions,'data_source'=>[
                'authority'=>$this->dataAuthority,'mode'=>$this->dataMode,'reference'=>$this->dataReference,
            ],'component_hint'=>$this->componentHint,
        ];
    }
}

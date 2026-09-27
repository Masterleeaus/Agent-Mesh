<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Collection;

use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;
use JsonSerializable;

final readonly class CollectionViewOption implements JsonSerializable
{
    public function __construct(
        public string $viewKey,
        public string $label,
        public string $kind,
        public ?string $componentHint,
    ) {}

    public static function fromDescriptor(ViewDescriptor $view): self
    {
        return new self($view->key,$view->label,$view->kind,$view->componentHint);
    }

    public function jsonSerialize(): array
    {
        return ['view_key'=>$this->viewKey,'label'=>$this->label,'kind'=>$this->kind,'component_hint'=>$this->componentHint];
    }
}

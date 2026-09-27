<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

final readonly class FocusWorkspaceProfile implements \JsonSerializable
{
    public function __construct(
        public bool $enabled,
        public string $targetKind,
        public string $targetReference,
        public string $productSurface,
        public bool $hideSecondaryNavigation = true,
        public bool $hideNonessentialChrome = true,
        public bool $preserveGlobalSafetyControls = true,
        public bool $preserveAttentionHud = true,
        public string $escapeControl = 'Escape',
    ) {}

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'enabled'=>$this->enabled,
            'target_kind'=>$this->targetKind,
            'target_reference'=>$this->targetReference,
            'product_surface'=>$this->productSurface,
            'hide_secondary_navigation'=>$this->hideSecondaryNavigation,
            'hide_nonessential_chrome'=>$this->hideNonessentialChrome,
            'preserve_global_safety_controls'=>$this->preserveGlobalSafetyControls,
            'preserve_attention_hud'=>$this->preserveAttentionHud,
            'escape_control'=>$this->escapeControl,
            'presentation_only'=>true,
        ];
    }
}

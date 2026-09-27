<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

/** Final v1 donor decisions. This is presentation ownership metadata, never extension enable/disable automation. */
final class DonorRationalizationCatalog
{
    /** @return array<string,array<string,mixed>> */
    public function all(): array
    {
        return [
            'menu'=>[
                'decision'=>'absorbed','primitive'=>'menu-projection','data_authority'=>'host-menu-service','wizard_authority'=>false,
                'replacement'=>'RegistryNavigationProjector + TitanHostMenuCompatibilityAdapter',
            ],
            'focus-mode'=>[
                'decision'=>'retire-after-cutover','primitive'=>'workspace-focus','data_authority'=>'none','wizard_authority'=>false,
                'replacement'=>'FocusWorkspacePolicy',
            ],
            'announcement'=>[
                'decision'=>'presentation-absorbed-source-retained','primitive'=>'hud-attention','data_authority'=>'source-extension','wizard_authority'=>false,
                'replacement'=>'Global Work attention provider + AttentionHudProjector',
            ],
            'onboarding-pro'=>[
                'decision'=>'split-and-retire-duplicate-tour','primitive'=>'coachmark-guidance','data_authority'=>'source-extension','wizard_authority'=>false,
                'replacement'=>'GuidanceOverlayProjector; Interaction Engine remains wizard/journey authority',
            ],
            'introductions'=>[
                'decision'=>'retire','primitive'=>'coachmark-guidance','data_authority'=>'none','wizard_authority'=>false,
                'replacement'=>'GuidanceOverlayProjector',
            ],
        ];
    }
}

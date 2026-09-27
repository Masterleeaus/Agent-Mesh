<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Renderer;

use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

interface WizardRendererInterface
{
    public function render(WizardSession $session): array|string;
}

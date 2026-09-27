<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Renderer;

use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

final class ArrayRenderer implements WizardRendererInterface
{
    public function render(WizardSession $session): array
    {
        return [
            'session_id' => $session->id,
            'wizard_id' => $session->definition->id,
            'status' => $session->status,
            'step_index' => $session->stepIndex,
            'step' => $session->currentStep(),
            'data' => $session->data,
        ];
    }
}

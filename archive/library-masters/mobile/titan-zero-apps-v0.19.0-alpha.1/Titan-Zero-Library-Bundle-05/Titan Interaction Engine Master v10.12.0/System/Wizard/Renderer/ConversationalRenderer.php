<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Renderer;

use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

final class ConversationalRenderer implements WizardRendererInterface
{
    public function render(WizardSession $session): string
    {
        if ($session->complete()) {
            return $session->definition->name . ' is complete.';
        }
        $step = $session->currentStep() ?? [];
        return (string) ($step['question'] ?? $step['description'] ?? $step['title'] ?? 'Provide the next details.');
    }
}

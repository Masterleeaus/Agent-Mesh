<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Template;

use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;

final readonly class TemplateCompatibilityChecker
{
    public function __construct(private WizardRegistry $wizards)
    {
    }

    /**
     * @param iterable<string> $hostCapabilities
     */
    public function check(TemplateDefinition $template, iterable $hostCapabilities): TemplateCompatibilityReport
    {
        $available = [];
        foreach ($hostCapabilities as $capability) {
            $available[(string) $capability] = true;
        }

        $missingEntryWizard = !$this->wizards->has($template->entryWizard);
        $missingCapabilities = [];
        foreach ($template->capabilities as $capability) {
            if (!isset($available[$capability])) {
                $missingCapabilities[] = $capability;
            }
        }

        $errors = [];
        if ($template->status !== 'ready') {
            $errors[] = "Template '{$template->id}' is not executable while status is '{$template->status}'.";
        }
        if ($missingEntryWizard) {
            $errors[] = "Entry wizard '{$template->entryWizard}' is not registered.";
        } else {
            $wizardCapability = $this->wizards->get($template->entryWizard)->capability;
            if (!in_array($wizardCapability, $template->capabilities, true)) {
                $errors[] = "Entry wizard capability '{$wizardCapability}' is not declared by the template.";
            }
        }
        foreach ($missingCapabilities as $capability) {
            $errors[] = "Required host capability '{$capability}' is unavailable.";
        }

        return new TemplateCompatibilityReport(
            templateId: $template->id,
            compatible: $template->status === 'ready' && !$missingEntryWizard && $missingCapabilities === [] && $errors === [],
            missingEntryWizard: $missingEntryWizard,
            missingCapabilities: $missingCapabilities,
            errors: $errors,
        );
    }
}

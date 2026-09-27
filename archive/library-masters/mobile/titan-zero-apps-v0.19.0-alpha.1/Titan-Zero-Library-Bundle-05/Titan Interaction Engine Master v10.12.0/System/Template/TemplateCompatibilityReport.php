<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Template;

final readonly class TemplateCompatibilityReport
{
    /**
     * @param list<string> $missingCapabilities
     * @param list<string> $errors
     */
    public function __construct(
        public string $templateId,
        public bool $compatible,
        public bool $missingEntryWizard,
        public array $missingCapabilities = [],
        public array $errors = [],
    ) {
    }

    public function toArray(): array
    {
        return [
            'template_id' => $this->templateId,
            'compatible' => $this->compatible,
            'missing_entry_wizard' => $this->missingEntryWizard,
            'missing_capabilities' => $this->missingCapabilities,
            'errors' => $this->errors,
        ];
    }
}

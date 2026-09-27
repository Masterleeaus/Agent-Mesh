<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard;

final readonly class WizardResult
{
    public function __construct(
        public WizardSession $session,
        public bool $complete = false,
        public array $errors = [],
        public ?string $guidance = null,
        public ?array $command = null,
    ) {}
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Storage;

use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

interface WizardSessionStoreInterface
{
    public function put(WizardSession $session): void;

    public function get(string $sessionId): ?WizardSession;

    public function delete(string $sessionId): void;
}

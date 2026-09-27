<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Storage;

use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

final class InMemoryWizardSessionStore implements WizardSessionStoreInterface
{
    /** @var array<string, array> */
    private array $sessions = [];

    public function put(WizardSession $session): void
    {
        $this->sessions[$session->id] = $session->toArray();
    }

    public function get(string $sessionId): ?WizardSession
    {
        $data = $this->sessions[$sessionId] ?? null;
        return is_array($data) ? WizardSession::fromArray($data) : null;
    }

    public function delete(string $sessionId): void
    {
        unset($this->sessions[$sessionId]);
    }
}

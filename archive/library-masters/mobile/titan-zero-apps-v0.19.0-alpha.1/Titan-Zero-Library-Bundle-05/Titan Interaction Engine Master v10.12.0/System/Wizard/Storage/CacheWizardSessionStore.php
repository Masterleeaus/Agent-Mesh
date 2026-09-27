<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Storage;

use Illuminate\Contracts\Cache\Repository;
use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;
use App\Extensions\InteractionEngine\System\Wizard\WizardSession;

final class CacheWizardSessionStore implements WizardSessionStoreInterface
{
    public function __construct(
        private readonly Repository $cache,
        private readonly WizardRegistry $registry,
        private readonly int $ttlSeconds = 86400,
    ) {}

    public function put(WizardSession $session): void
    {
        $this->cache->put($this->key($session->id), $session->toArray(), $this->ttlSeconds);
    }

    public function get(string $sessionId): ?WizardSession
    {
        $data = $this->cache->get($this->key($sessionId));
        if (!is_array($data)) {
            return null;
        }
        $wizardId = (string) ($data['definition']['id'] ?? '');
        $definition = $wizardId !== '' && $this->registry->has($wizardId)
            ? $this->registry->get($wizardId)
            : null;
        return WizardSession::fromArray($data, $definition);
    }

    public function delete(string $sessionId): void
    {
        $this->cache->forget($this->key($sessionId));
    }

    private function key(string $sessionId): string
    {
        return 'interaction:wizard-session:' . $sessionId;
    }
}

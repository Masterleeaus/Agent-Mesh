<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Release;

use RuntimeException;

final class CurrentRelease
{
    private ?array $manifest = null;

    public function version(): string
    {
        $version = trim((string) ($this->manifest()['version'] ?? ''));
        if ($version === '') {
            throw new RuntimeException('Interaction Engine release version is unavailable.');
        }
        return $version;
    }

    /** @return array<string,mixed> */
    public function manifest(): array
    {
        if ($this->manifest !== null) {
            return $this->manifest;
        }

        $path = dirname(__DIR__, 2).'/extension.json';
        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException('Interaction Engine release manifest is unavailable.');
        }
        return $this->manifest = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    }
}

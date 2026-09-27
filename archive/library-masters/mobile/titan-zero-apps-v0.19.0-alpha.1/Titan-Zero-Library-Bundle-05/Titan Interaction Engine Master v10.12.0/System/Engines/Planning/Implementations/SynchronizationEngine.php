<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\SynchronizationEngineInterface;
class SynchronizationEngine implements SynchronizationEngineInterface
{
    private array $syncs = [];

    public function sync(string $source, string $target): void
    {
        $this->syncs[] = [
            'id' => uniqid('sync_'),
            'source' => $source,
            'target' => $target,
            'status' => 'completed',
            'timestamp' => now(),
        ];
    }

    public function getStatus(string $syncId): array
    {
        foreach ($this->syncs as $sync) {
            if ($sync['id'] === $syncId) {
                return $sync;
            }
        }
        return ['status' => 'not_found'];
    }

    public function listSyncs(): array
    {
        return $this->syncs;
    }
}

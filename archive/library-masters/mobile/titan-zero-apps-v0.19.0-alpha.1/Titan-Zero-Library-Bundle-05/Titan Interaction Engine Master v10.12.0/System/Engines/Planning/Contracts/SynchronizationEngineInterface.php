<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface SynchronizationEngineInterface
{
    public function sync(string $source, string $target): void;
    public function getStatus(string $syncId): array;
    public function listSyncs(): array;
}

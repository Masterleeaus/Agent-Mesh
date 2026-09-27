<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface WorldModelEngineInterface
{
    public function refresh(): void;
    public function getEntity(string $type, string $id): ?array;
    public function findEntities(string $type, array $criteria): array;
    public function getState(): array;
}

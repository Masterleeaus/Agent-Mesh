<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface MemoryEngineInterface
{
    public function store(string $type, array $data): void;
    public function recall(string $type, array $query): array;
    public function forget(string $type, array $query): void;
    public function consolidate(): void;
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface EpisodicMemoryEngineInterface
{
    public function store(array $event): void;
    public function recall(array $query): array;
    public function consolidate(): void;
    public function forgetOlderThan(int $days): void;
}

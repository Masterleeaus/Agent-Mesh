<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface SemanticMemoryEngineInterface
{
    public function store(array $fact): void;
    public function query(array $query): array;
    public function consolidate(): void;
    public function getFacts(): array;
}

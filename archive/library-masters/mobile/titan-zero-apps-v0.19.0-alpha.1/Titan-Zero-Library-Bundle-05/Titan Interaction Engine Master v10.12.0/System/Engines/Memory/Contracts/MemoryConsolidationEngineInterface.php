<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Contracts;

interface MemoryConsolidationEngineInterface
{
    public function consolidate(array $events): void;
    public function summarize(array $events): array;
    public function prioritizeForConsolidation(): array;
}

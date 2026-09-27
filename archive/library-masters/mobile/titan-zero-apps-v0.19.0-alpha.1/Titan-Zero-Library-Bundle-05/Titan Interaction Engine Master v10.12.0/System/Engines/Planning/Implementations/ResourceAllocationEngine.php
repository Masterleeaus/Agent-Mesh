<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\ResourceAllocationEngineInterface;
class ResourceAllocationEngine implements ResourceAllocationEngineInterface
{
    private array $allocations = [];

    public function allocate(string $resource, string $task): void
    {
        $this->allocations[$resource] = $task;
    }

    public function deallocate(string $resource, string $task): void
    {
        unset($this->allocations[$resource]);
    }

    public function getResourceAllocation(): array
    {
        return $this->allocations;
    }
}

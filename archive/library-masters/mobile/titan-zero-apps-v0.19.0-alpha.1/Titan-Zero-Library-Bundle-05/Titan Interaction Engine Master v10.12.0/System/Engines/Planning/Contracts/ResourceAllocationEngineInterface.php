<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface ResourceAllocationEngineInterface
{
    public function allocate(string $resource, string $task): void;
    public function deallocate(string $resource, string $task): void;
    public function getResourceAllocation(): array;
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface TaskDecompositionEngineInterface
{
    public function decompose(string $task, array $context): array;
    public function prioritize(array $subtasks): array;
    public function schedule(array $subtasks): array;
}

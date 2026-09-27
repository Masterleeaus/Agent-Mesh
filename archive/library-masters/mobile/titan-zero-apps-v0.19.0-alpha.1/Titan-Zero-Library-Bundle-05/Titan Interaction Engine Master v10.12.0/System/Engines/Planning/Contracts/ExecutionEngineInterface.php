<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface ExecutionEngineInterface
{
    public function execute(string $task, array $parameters): array;
    public function executeBatch(array $tasks): array;
    public function getExecutionHistory(): array;
}

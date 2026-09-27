<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\DispatchEngineInterface;
class DispatchEngine implements DispatchEngineInterface
{
    private array $tasks = [];

    public function dispatch(string $task, array $parameters): string
    {
        $id = uniqid('task_');
        $this->tasks[$id] = ['task' => $task, 'parameters' => $parameters, 'status' => 'pending'];
        return $id;
    }

    public function getDispatchStatus(string $taskId): array
    {
        return $this->tasks[$taskId] ?? ['status' => 'not_found'];
    }

    public function listPendingTasks(): array
    {
        return array_filter($this->tasks, fn($t) => $t['status'] === 'pending');
    }
}

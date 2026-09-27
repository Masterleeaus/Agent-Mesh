<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\ExecutionEngineInterface;

final class ExecutionEngine implements ExecutionEngineInterface
{
    private array $history = [];
    /** @var array<string,callable> */
    private array $executors = [];

    public function registerExecutor(string $task, callable $executor): void
    {
        $task = trim($task);
        if ($task === '') throw new \InvalidArgumentException('Execution task name cannot be empty.');
        $this->executors[$task] = $executor;
    }

    public function execute(string $task, array $parameters): array
    {
        if (!isset($this->executors[$task])) {
            $result = ['status' => 'unavailable', 'result' => null, 'reason' => 'No executor registered for task.'];
            $this->history[] = compact('task', 'parameters', 'result');
            return $result;
        }
        try {
            $value = ($this->executors[$task])($parameters);
            $result = ['status' => 'success', 'result' => $value];
        } catch (\Throwable $e) {
            $result = ['status' => 'failed', 'result' => null, 'error' => $e->getMessage()];
        }
        $this->history[] = compact('task', 'parameters', 'result');
        return $result;
    }

    public function executeBatch(array $tasks): array
    {
        $results = [];
        foreach ($tasks as $task) {
            $results[] = $this->execute((string) ($task['name'] ?? ''), (array) ($task['parameters'] ?? []));
        }
        return $results;
    }

    public function getExecutionHistory(): array
    {
        return $this->history;
    }
}

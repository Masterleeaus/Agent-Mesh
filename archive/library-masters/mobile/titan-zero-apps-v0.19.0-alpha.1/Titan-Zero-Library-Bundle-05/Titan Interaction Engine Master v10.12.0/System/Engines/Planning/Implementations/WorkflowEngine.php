<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\WorkflowEngineInterface;
class WorkflowEngine implements WorkflowEngineInterface
{
    private array $workflows = [];
    private array $executions = [];

    public function registerWorkflow(string $name, array $steps): void
    {
        $this->workflows[$name] = $steps;
    }

    public function startWorkflow(string $name, array $input): void
    {
        $executionId = uniqid('wf_');
        $this->executions[$executionId] = [
            'workflow' => $name,
            'input' => $input,
            'status' => 'running',
            'started_at' => now(),
        ];
    }

    public function getStatus(string $executionId): array
    {
        return $this->executions[$executionId] ?? ['status' => 'not_found'];
    }

    public function listWorkflows(): array
    {
        return array_keys($this->workflows);
    }
}

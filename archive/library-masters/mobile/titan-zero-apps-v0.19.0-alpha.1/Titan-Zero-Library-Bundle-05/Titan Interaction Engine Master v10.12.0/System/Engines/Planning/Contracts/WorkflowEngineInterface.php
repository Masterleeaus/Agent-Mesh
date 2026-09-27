<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface WorkflowEngineInterface
{
    public function registerWorkflow(string $name, array $steps): void;
    public function startWorkflow(string $name, array $input): void;
    public function getStatus(string $executionId): array;
    public function listWorkflows(): array;
}

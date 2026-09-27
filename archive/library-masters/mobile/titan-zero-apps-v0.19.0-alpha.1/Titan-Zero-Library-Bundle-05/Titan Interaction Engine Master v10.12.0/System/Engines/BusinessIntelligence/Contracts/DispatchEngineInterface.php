<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts;

interface DispatchEngineInterface
{
    public function dispatch(string $task, array $parameters): string;
    public function getDispatchStatus(string $taskId): array;
    public function listPendingTasks(): array;
}

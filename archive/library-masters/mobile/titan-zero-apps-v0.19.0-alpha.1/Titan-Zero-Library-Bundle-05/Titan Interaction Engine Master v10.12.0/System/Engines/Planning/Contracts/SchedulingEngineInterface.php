<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Contracts;

interface SchedulingEngineInterface
{
    public function schedule(array $tasks, array $resources): array;
    public function reschedule(string $taskId, array $parameters): void;
    public function getSchedule(): array;
}

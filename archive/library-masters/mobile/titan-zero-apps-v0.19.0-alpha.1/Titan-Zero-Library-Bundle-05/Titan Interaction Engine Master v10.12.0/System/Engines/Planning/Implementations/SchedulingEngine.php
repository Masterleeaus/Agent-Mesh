<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\SchedulingEngineInterface;

/**
 * Greedy resource-assignment scheduler — assigns each task to the first
 * resource with capacity remaining. Simple, but genuinely built from
 * $tasks/$resources rather than ignoring them. Fixed during the fix pass:
 * schedule() ignored both parameters and returned the (always-empty)
 * $this->schedule property, which nothing ever populated.
 */
class SchedulingEngine implements SchedulingEngineInterface
{
    private array $schedule = [];

    public function schedule(array $tasks, array $resources): array
    {
        $capacity = [];
        foreach ($resources as $resource) {
            $id = $resource['id'] ?? uniqid('resource_');
            $capacity[$id] = $resource['capacity'] ?? 1;
        }

        $assignments = [];
        foreach ($tasks as $task) {
            $taskId = $task['id'] ?? uniqid('task_');
            $assigned = null;
            foreach ($capacity as $resourceId => $remaining) {
                if ($remaining > 0) {
                    $capacity[$resourceId]--;
                    $assigned = $resourceId;
                    break;
                }
            }
            $assignments[$taskId] = [
                'task' => $task,
                'resource_id' => $assigned,
                'status' => $assigned !== null ? 'scheduled' : 'unassigned',
            ];
        }

        $this->schedule = $assignments;
        return $this->schedule;
    }

    public function reschedule(string $taskId, array $parameters): void
    {
        $this->schedule[$taskId] = array_merge($this->schedule[$taskId] ?? [], $parameters);
    }

    public function getSchedule(): array
    {
        return $this->schedule;
    }
}

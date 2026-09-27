<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\TaskDecompositionEngineInterface;

class TaskDecompositionEngine implements TaskDecompositionEngineInterface
{
    public function decompose(string $task, array $context): array
    {
        $steps = $context['steps'] ?? preg_split('/\s*(?:,|;|\band\b|\bthen\b)\s*/i', trim($task), -1, PREG_SPLIT_NO_EMPTY);
        $subtasks = [];
        foreach (array_values($steps ?: [$task]) as $index => $step) {
            $subtasks[] = [
                'id' => 'task_' . ($index + 1),
                'action' => trim((string) $step),
                'priority' => max(1, count($steps ?: [$task]) - $index),
                'dependencies' => $index === 0 ? [] : ['task_' . $index],
                'status' => 'pending',
            ];
        }
        return $subtasks;
    }

    public function prioritize(array $subtasks): array
    {
        usort($subtasks, static fn(array $a, array $b): int => ($b['priority'] ?? 0) <=> ($a['priority'] ?? 0));
        return $subtasks;
    }

    public function schedule(array $subtasks): array
    {
        $scheduled = [];
        $cursor = time();
        foreach ($subtasks as $subtask) {
            $duration = max(1, (int) ($subtask['duration_minutes'] ?? 15));
            $subtask['scheduled_start'] = gmdate(DATE_ATOM, $cursor);
            $cursor += $duration * 60;
            $subtask['scheduled_end'] = gmdate(DATE_ATOM, $cursor);
            $scheduled[] = $subtask;
        }
        return $scheduled;
    }
}

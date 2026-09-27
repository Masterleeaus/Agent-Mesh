<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\AutomationEngineInterface;

final class AutomationEngine implements AutomationEngineInterface
{
    private array $automations = [];

    public function automate(string $task, array $schedule): void
    {
        $task = trim($task);
        if ($task === '') {
            throw new \InvalidArgumentException('Automation task cannot be empty.');
        }
        $id = hash('sha256', $task . '|' . json_encode($schedule, JSON_THROW_ON_ERROR) . '|' . count($this->automations));
        $this->automations[] = [
            'id' => $id,
            'task' => $task,
            'schedule' => $schedule,
            'status' => 'scheduled',
            'created_at' => gmdate(DATE_ATOM),
        ];
    }

    public function getAutomations(): array
    {
        return $this->automations;
    }

    public function trigger(string $automationId): void
    {
        foreach ($this->automations as &$automation) {
            if (($automation['id'] ?? null) !== $automationId) continue;
            $automation['status'] = 'triggered';
            $automation['triggered_at'] = gmdate(DATE_ATOM);
            return;
        }
        unset($automation);
        throw new \OutOfBoundsException("Automation {$automationId} is not registered.");
    }
}

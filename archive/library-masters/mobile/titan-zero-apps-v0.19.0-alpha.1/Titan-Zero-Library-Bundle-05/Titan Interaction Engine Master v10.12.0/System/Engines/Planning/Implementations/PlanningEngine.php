<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Planning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Planning\Contracts\PlanningEngineInterface;

class PlanningEngine implements PlanningEngineInterface
{
    private array $plans = [];

    public function generatePlan(string $goal, array $context): array
    {
        $steps = $context['steps'] ?? [
            ['action' => 'clarify_goal', 'priority' => 100],
            ['action' => 'gather_required_data', 'priority' => 80],
            ['action' => 'execute_capability', 'priority' => 60],
            ['action' => 'verify_outcome', 'priority' => 40],
        ];
        $plan = [
            'id' => 'plan_' . bin2hex(random_bytes(8)),
            'goal' => $goal,
            'context' => $context,
            'steps' => array_values($steps),
            'status' => 'active',
            'created_at' => gmdate(DATE_ATOM),
        ];
        if (!$this->validatePlan($plan)) {
            throw new \InvalidArgumentException('Generated plan is invalid.');
        }
        $this->plans[$plan['id']] = $plan;
        return $plan;
    }

    public function decomposePlan(array $plan): array
    {
        return array_values($plan['steps'] ?? []);
    }

    public function validatePlan(array $plan): bool
    {
        if (empty($plan['goal']) || empty($plan['steps']) || !is_array($plan['steps'])) {
            return false;
        }
        foreach ($plan['steps'] as $step) {
            if (!is_array($step) || empty($step['action'])) {
                return false;
            }
        }
        return true;
    }

    public function getActivePlans(): array
    {
        return array_values(array_filter($this->plans, static fn(array $plan): bool => ($plan['status'] ?? null) === 'active'));
    }
}

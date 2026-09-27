<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Learning\Contracts\ReinforcementLearningEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;

class ReinforcementLearningEngine implements ReinforcementLearningEngineInterface
{
    private array $qTable = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->qTable = Cache::get($this->tenantContext->cacheKey('rl_qtable'), []);
    }

    public function getAction(array $state): string
    {
        $actions = ['action1', 'action2', 'action3'];
        $bestAction = $actions[0];
        $bestValue = -INF;
        foreach ($actions as $action) {
            $value = $this->qTable[md5(serialize($state) . $action)] ?? 0;
            if ($value > $bestValue) {
                $bestValue = $value;
                $bestAction = $action;
            }
        }
        return $bestAction;
    }

    public function updateQValue(array $state, string $action, float $reward): void
    {
        $key = md5(serialize($state) . $action);
        $this->qTable[$key] = ($this->qTable[$key] ?? 0) + 0.1 * ($reward - ($this->qTable[$key] ?? 0));
        Cache::put($this->tenantContext->cacheKey('rl_qtable'), $this->qTable, 86400 * 30);
    }

    public function getPolicy(): array
    {
        return ['policy' => 'epsilon_greedy', 'epsilon' => 0.1];
    }
}

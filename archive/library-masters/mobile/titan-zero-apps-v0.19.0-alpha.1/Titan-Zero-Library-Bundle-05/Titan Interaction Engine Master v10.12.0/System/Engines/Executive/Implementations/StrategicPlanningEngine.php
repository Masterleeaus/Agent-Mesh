<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\StrategicPlanningEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;

class StrategicPlanningEngine implements StrategicPlanningEngineInterface
{
    private array $strategies = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->loadStrategies();
    }

    public function defineStrategy(string $name, array $objectives): void
    {
        $this->strategies[$name] = [
            'name' => $name,
            'objectives' => $objectives,
            'created_at' => now(),
            'status' => 'active',
        ];
        $this->saveStrategies();
    }

    public function getActiveStrategies(): array
    {
        return array_filter($this->strategies, fn($s) => $s['status'] === 'active');
    }

    public function evaluateStrategy(string $name): array
    {
        if (!isset($this->strategies[$name])) {
            return ['error' => 'Strategy not found'];
        }

        return [
            'strategy' => $name,
            'progress' => rand(0, 100),
            'status' => $this->strategies[$name]['status'],
        ];
    }

    public function updateStrategy(string $name, array $updates): void
    {
        if (isset($this->strategies[$name])) {
            $this->strategies[$name] = array_merge($this->strategies[$name], $updates);
            $this->saveStrategies();
        }
    }

    private function loadStrategies(): void
    {
        $this->strategies = Cache::get($this->tenantContext->cacheKey('strategic_plans'), []);
    }

    private function saveStrategies(): void
    {
        Cache::put($this->tenantContext->cacheKey('strategic_plans'), $this->strategies, 86400 * 30);
    }
}

<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Healer;

use App\Extensions\InteractionEngine\System\Contracts\HealerInterface;
use App\Extensions\InteractionEngine\System\Models\InteractionEvent;
use App\Extensions\InteractionEngine\System\Models\InteractionRun;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

final class HealerEngine implements HealerInterface
{
    private array $healingStrategies = [];

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->registerDefaultStrategies();
    }

    public function detectAnomalies(): array
    {
        $companyId = $this->tenantContext->companyId();
        $anomalies = [];

        $stuckRuns = InteractionRun::query()
            ->where('company_id', $companyId)
            ->where('state', 'in_progress')
            ->where('updated_at', '<', now()->subHours(24))
            ->limit(5000)->get();

        foreach ($stuckRuns as $run) {
            $anomalies[] = [
                'type' => 'stuck_run',
                'run_id' => $run->id,
                'user_id' => $run->user_id,
                'interaction_id' => $run->interaction_id,
                'message' => 'Run stuck for 24+ hours',
                'severity' => 'medium',
            ];
        }

        $tenantRunIds = InteractionRun::query()->where('company_id', $companyId)->select('id');
        $failedEvents = InteractionEvent::query()
            ->whereIn('run_id', $tenantRunIds)
            ->where('event_type', 'capability_executed')
            ->whereRaw("JSON_EXTRACT(data, '$.success') = false")
            ->where('occurred_at', '>', now()->subHours(24))
            ->count();

        if ($failedEvents > 10) {
            $anomalies[] = [
                'type' => 'high_failure_rate',
                'message' => "{$failedEvents} failures in the last 24 hours",
                'severity' => 'high',
            ];
        }

        return $anomalies;
    }

    public function heal(int $runId): void
    {
        $companyId = $this->tenantContext->companyId();
        $run = InteractionRun::query()
            ->where('company_id', $companyId)
            ->where('id', $runId)
            ->first();
        if (!$run) {
            return;
        }

        if ($run->state === 'in_progress' && $run->updated_at < now()->subHours(24)) {
            $run->state = 'failed';
            $run->meta = array_merge($run->meta ?? [], [
                'healed' => true,
                'healed_at' => now(),
                'healing_reason' => 'Auto-healed: stuck in progress',
            ]);
            $run->save();
            Log::info('Healed stuck interaction run', ['company_id' => $companyId, 'run_id' => $runId]);
        }
    }

    public function prevent(array $pattern): void
    {
        $key = $this->tenantContext->cacheKey('healing_prevent:' . md5(serialize($pattern)));
        $preventions = Cache::get($key, []);
        $preventions[] = ['pattern' => $pattern, 'timestamp' => now()];
        Cache::put($key, $preventions, 86400 * 30);
    }

    private function registerDefaultStrategies(): void
    {
        $this->registerStrategy('stuck_run', function ($anomaly) {
            $this->heal($anomaly['run_id']);
            return true;
        });
        $this->registerStrategy('high_failure_rate', function ($anomaly) {
            Log::warning('High failure rate detected', ['count' => $anomaly['message']]);
            return true;
        });
    }

    public function registerStrategy(string $type, callable $strategy): void
    {
        $this->healingStrategies[$type] = $strategy;
    }
}

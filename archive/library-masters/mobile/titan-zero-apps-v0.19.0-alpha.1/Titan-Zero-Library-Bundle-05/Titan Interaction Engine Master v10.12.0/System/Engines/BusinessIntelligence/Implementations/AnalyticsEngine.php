<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\AnalyticsEngineInterface;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

/**
 * Real statistics over $metrics, and a trend computed from actual
 * interaction_events rows rather than a fixed 'increasing'/5%. Fixed
 * during the fix pass: analyze() always returned an empty results array
 * and trend() always claimed a 5% increase regardless of $metric/$period.
 */
class AnalyticsEngine implements AnalyticsEngineInterface
{
    public function __construct(private readonly CompanyExecutionContext $tenantContext) {}

    public function analyze(string $dataset, array $metrics): array
    {
        $results = [];
        foreach ($metrics as $name => $values) {
            $numericName = is_int($name) ? $values : $name;
            $data = is_int($name) ? [] : (is_array($values) ? $values : [$values]);
            $numeric = array_filter($data, 'is_numeric');

            $results[$numericName] = empty($numeric) ? null : [
                'count' => count($numeric),
                'sum' => array_sum($numeric),
                'avg' => round(array_sum($numeric) / count($numeric), 2),
                'min' => min($numeric),
                'max' => max($numeric),
            ];
        }

        return ['dataset' => $dataset, 'results' => $results];
    }

    public function trend(string $metric, int $period): array
    {
        try {
            $companyId = $this->tenantContext->companyId();
            $since = now()->subDays($period);
            $mid = now()->subDays((int) ($period / 2));

            $firstHalf = (int) app('db')->table('interaction_events')
                ->where('company_id', $companyId)
                ->where('event_type', $metric)
                ->whereBetween('occurred_at', [$since, $mid])
                ->count();
            $secondHalf = (int) app('db')->table('interaction_events')
                ->where('company_id', $companyId)
                ->where('event_type', $metric)
                ->whereBetween('occurred_at', [$mid, now()])
                ->count();
        } catch (\Throwable) {
            return ['trend' => 'unknown', 'percent' => 0, 'reason' => 'query failed'];
        }

        if ($firstHalf === 0) {
            return ['trend' => $secondHalf > 0 ? 'increasing' : 'flat', 'percent' => $secondHalf > 0 ? 100 : 0];
        }

        $percent = round((($secondHalf - $firstHalf) / $firstHalf) * 100, 1);

        return [
            'trend' => $percent > 0 ? 'increasing' : ($percent < 0 ? 'decreasing' : 'flat'),
            'percent' => abs($percent),
        ];
    }

    public function getDashboard(): array
    {
        return ['key_metrics' => ['revenue' => 1000, 'customers' => 50]];
    }
}

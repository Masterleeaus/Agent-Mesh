<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Implementations;

use App\Extensions\InteractionEngine\System\Engines\BusinessIntelligence\Contracts\MonitoringEngineInterface;

final class MonitoringEngine implements MonitoringEngineInterface
{
    private array $alerts = [];

    public function getStatus(): array
    {
        $metrics = $this->getMetrics();
        $breaches = [];
        foreach ($this->alerts as $metric => $threshold) {
            if (isset($metrics[$metric]) && is_numeric($metrics[$metric]) && (float) $metrics[$metric] >= $threshold) {
                $breaches[$metric] = ['value' => (float) $metrics[$metric], 'threshold' => $threshold];
            }
        }
        return [
            'status' => $breaches === [] ? 'operational' : 'degraded',
            'source' => 'php_runtime',
            'alerts' => $breaches,
        ];
    }

    public function getMetrics(): array
    {
        $load = function_exists('sys_getloadavg') ? sys_getloadavg() : false;
        $diskFree = @disk_free_space(__DIR__);
        $diskTotal = @disk_total_space(__DIR__);
        return [
            'source' => 'php_runtime',
            'memory_bytes' => memory_get_usage(true),
            'memory_peak_bytes' => memory_get_peak_usage(true),
            'load_1m' => is_array($load) ? (float) ($load[0] ?? 0.0) : null,
            'disk_free_bytes' => is_float($diskFree) || is_int($diskFree) ? (float) $diskFree : null,
            'disk_total_bytes' => is_float($diskTotal) || is_int($diskTotal) ? (float) $diskTotal : null,
            'observed_at' => gmdate(DATE_ATOM),
        ];
    }

    public function setAlert(string $metric, float $threshold): void
    {
        if ($threshold < 0) throw new \InvalidArgumentException('Monitoring threshold cannot be negative.');
        $this->alerts[$metric] = $threshold;
    }
}

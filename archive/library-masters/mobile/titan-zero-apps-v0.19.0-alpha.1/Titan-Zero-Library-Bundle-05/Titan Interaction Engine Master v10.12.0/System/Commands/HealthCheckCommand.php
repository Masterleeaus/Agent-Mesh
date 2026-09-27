<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Commands;

use Illuminate\Console\Command;
use App\Extensions\InteractionEngine\System\Monitoring\HealthCheck;

final class HealthCheckCommand extends Command
{
    protected $signature = 'interaction-engine:health {--json : Emit machine-readable JSON}';
    protected $description = 'Check Interaction Engine configuration and runtime dependencies';

    public function handle(HealthCheck $health): int
    {
        $result = $health->run();
        if ($this->option('json')) {
            $this->line((string) json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } else {
            $this->table(
                ['Check', 'Status', 'Detail'],
                array_map(static fn(array $check): array => [
                    $check['name'],
                    $check['healthy'] ? 'PASS' : 'FAIL',
                    $check['detail'],
                ], $result['checks']),
            );
            $result['healthy'] ? $this->info('Interaction Engine is healthy.') : $this->error('Interaction Engine has failing checks.');
        }
        return $result['healthy'] ? self::SUCCESS : self::FAILURE;
    }
}

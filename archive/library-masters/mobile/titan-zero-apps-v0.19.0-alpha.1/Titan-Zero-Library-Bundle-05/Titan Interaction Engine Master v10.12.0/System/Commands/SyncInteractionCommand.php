<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Commands;

use App\Extensions\InteractionEngine\System\Offline\SyncEngine;
use Illuminate\Console\Command;

final class SyncInteractionCommand extends Command
{
    protected $signature = 'interaction-engine:sync {--company= : company_id to synchronize}';
    protected $description = 'Synchronize queued offline commands for one company tenant';

    public function handle(SyncEngine $syncEngine): int
    {
        $companyId = trim((string) $this->option('company'));
        if ($companyId === '') {
            $this->error('--company is required; queue workers must restore explicit company context.');
            return 2;
        }

        $results = $syncEngine->sync($companyId);
        $this->info("Synced: {$results['synced']}");
        $this->info("Failed: {$results['failed']}");
        $this->info("Conflicts: {$results['conflicts']}");

        return ($results['failed'] > 0 || $results['conflicts'] > 0) ? 1 : 0;
    }
}

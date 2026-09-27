<?php

namespace Modules\QualityControl\Console\Commands;

use Illuminate\Console\Command;
use Modules\QualityControl\Jobs\EnforceCorrectiveActionSlaJob;

class EnforceCorrectiveActionSlaCommand extends Command
{
    protected $signature = 'qc:enforce-corrective-action-sla {--company_id= : Limit enforcement to a single company}';

    protected $description = 'Enforce QC corrective action SLA — escalate all overdue open/in-progress actions';

    public function handle(): void
    {
        $companyId = $this->option('company_id') ? (int) $this->option('company_id') : null;

        $this->info('[QC SLA] Dispatching EnforceCorrectiveActionSlaJob' . ($companyId ? " for company $companyId" : ' for all companies'));

        EnforceCorrectiveActionSlaJob::dispatch($companyId)->onQueue('qc-automation');

        $this->info('[QC SLA] Job queued.');
    }
}

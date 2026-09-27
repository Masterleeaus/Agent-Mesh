<?php

namespace Modules\QualityControl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\QualityControl\Entities\QcCorrectiveAction;
use Modules\QualityControl\Events\CorrectiveActionOverdueEvent;

/**
 * Scheduler-driven SLA enforcement job.
 * Finds all overdue corrective actions across all tenants (or a single company)
 * and fires CorrectiveActionOverdueEvent for each, which listeners then process.
 */
class EnforceCorrectiveActionSlaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $backoff = 120;

    public function __construct(
        public readonly ?int $companyId = null,
    ) {
    }

    public function handle(): void
    {
        Log::info('[EnforceSla] Starting corrective action SLA scan', [
            'company_id' => $this->companyId ?? 'all',
        ]);

        $query = QcCorrectiveAction::query()
            ->whereIn('status', ['open', 'in_progress'])
            ->where('due_date', '<', now())
            ->when($this->companyId, fn ($q) => $q->where('company_id', $this->companyId));

        $overdue = $query->get();

        Log::info('[EnforceSla] Overdue corrective actions found', ['count' => $overdue->count()]);

        foreach ($overdue as $action) {
            try {
                CorrectiveActionOverdueEvent::dispatch($action, 'sla_enforcer');

                Log::info('[EnforceSla] Escalated action', ['corrective_action_id' => $action->id]);
            } catch (\Throwable $e) {
                Log::warning('[EnforceSla] Escalation failed', [
                    'corrective_action_id' => $action->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('[EnforceSla] SLA scan complete');
    }
}

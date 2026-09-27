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

class EscalateOverdueCorrectiveActionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly ?int $companyId = null,
    ) {
    }

    public function handle(): void
    {
        $query = QcCorrectiveAction::query()
            ->whereIn('status', ['open', 'in_progress'])
            ->where('due_date', '<', now())
            ->when($this->companyId, fn ($q) => $q->where('company_id', $this->companyId));

        $overdue = $query->get();

        if ($overdue->isEmpty()) {
            return;
        }

        Log::info('[EscalateOverdue] Processing overdue corrective actions', [
            'count' => $overdue->count(),
            'company_id' => $this->companyId,
        ]);

        foreach ($overdue as $action) {
            try {
                CorrectiveActionOverdueEvent::dispatch($action, 'job');

                Log::info('[EscalateOverdue] Dispatched CorrectiveActionOverdueEvent', [
                    'corrective_action_id' => $action->id,
                ]);
            } catch (\Throwable $e) {
                Log::warning('[EscalateOverdue] Failed to dispatch event', [
                    'corrective_action_id' => $action->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}

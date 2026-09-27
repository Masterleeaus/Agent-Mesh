<?php

namespace Modules\QualityControl\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\QualityControl\Entities\QcCorrectiveAction;
use Modules\QualityControl\Events\CorrectiveActionOverdueEvent;
use Modules\QualityControl\Mail\ComplaintEscalatedMail;

class CorrectiveActionOverdueListener implements ShouldQueue
{
    public string $queue = 'qc-automation';

    public function handle(CorrectiveActionOverdueEvent $event): void
    {
        Log::info('[CorrectiveActionOverdueListener] Received', [
            'corrective_action_id' => $event->correctiveActionId,
        ]);

        $action = QcCorrectiveAction::find($event->correctiveActionId);

        if (!$action) {
            return;
        }

        // Notify admins for the affected company.
        $adminEmails = $this->resolveAdminEmails($action->company_id);

        foreach ($adminEmails as $email) {
            try {
                Mail::to($email)->queue(new ComplaintEscalatedMail(
                    $action->complaint_id ?? null,
                    'Corrective action overdue — ' . $action->title,
                    $action->qc_record_id
                ));
            } catch (\Throwable $e) {
                Log::warning('[CorrectiveActionOverdueListener] Mail failed', ['error' => $e->getMessage()]);
            }
        }
    }

    private function resolveAdminEmails(?int $companyId): array
    {
        if (!$companyId || !class_exists(\App\Models\User::class)) {
            return [];
        }

        try {
            return \App\Models\User::query()
                ->where('company_id', $companyId)
                ->whereHas('roles', fn ($r) => $r->whereIn('name', ['admin', 'superadmin']))
                ->pluck('email')
                ->filter()
                ->unique()
                ->values()
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }
}

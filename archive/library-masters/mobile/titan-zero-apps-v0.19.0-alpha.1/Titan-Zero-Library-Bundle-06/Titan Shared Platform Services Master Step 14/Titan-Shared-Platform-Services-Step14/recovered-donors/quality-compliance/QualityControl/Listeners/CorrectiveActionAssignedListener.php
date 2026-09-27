<?php

namespace Modules\QualityControl\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\QualityControl\Entities\QcCorrectiveAction;
use Modules\QualityControl\Events\CorrectiveActionAssignedEvent;
use Modules\QualityControl\Mail\CorrectiveActionAssignedMail;

class CorrectiveActionAssignedListener implements ShouldQueue
{
    public string $queue = 'qc-automation';

    public function handle(CorrectiveActionAssignedEvent $event): void
    {
        Log::info('[CorrectiveActionAssignedListener] Received', [
            'corrective_action_id' => $event->correctiveActionId,
        ]);

        $action = QcCorrectiveAction::find($event->correctiveActionId);

        if (!$action) {
            return;
        }

        $recipientEmail = $this->resolveOwnerEmail($action);

        if ($recipientEmail) {
            Mail::to($recipientEmail)->queue(new CorrectiveActionAssignedMail($action));
        }
    }

    private function resolveOwnerEmail(QcCorrectiveAction $action): ?string
    {
        if (!$action->owner_id || !class_exists(\App\Models\User::class)) {
            return null;
        }

        try {
            return \App\Models\User::find($action->owner_id)?->email;
        } catch (\Throwable) {
            return null;
        }
    }
}

<?php

namespace Modules\QualityControl\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\QualityControl\Entities\QcFollowupVerification;
use Modules\QualityControl\Events\VerificationScheduledEvent;
use Modules\QualityControl\Mail\VerificationReminderMail;

class VerificationScheduledListener implements ShouldQueue
{
    public string $queue = 'qc-automation';

    public function handle(VerificationScheduledEvent $event): void
    {
        Log::info('[VerificationScheduledListener] Received', [
            'verification_id' => $event->verificationId,
        ]);

        $verification = QcFollowupVerification::find($event->verificationId);

        if (!$verification) {
            return;
        }

        $recipientEmail = $this->resolveAssigneeEmail($verification);

        if ($recipientEmail) {
            Mail::to($recipientEmail)->queue(new VerificationReminderMail($verification));
        }
    }

    private function resolveAssigneeEmail(QcFollowupVerification $verification): ?string
    {
        if (!$verification->assigned_to || !class_exists(\App\Models\User::class)) {
            return null;
        }

        try {
            return \App\Models\User::find($verification->assigned_to)?->email;
        } catch (\Throwable) {
            return null;
        }
    }
}

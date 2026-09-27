<?php

namespace Modules\QualityControl\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Modules\QualityControl\Events\VerificationCompletedEvent;
use Modules\QualityControl\Entities\QcFollowupVerification;
use Modules\CustomerFeedback\Entities\FeedbackTicket;

class VerificationCompletedListener implements ShouldQueue
{
    public string $queue = 'qc-automation';

    public function handle(VerificationCompletedEvent $event): void
    {
        Log::info('[VerificationCompletedListener] Received', [
            'verification_id' => $event->verificationId,
        ]);

        $verification = QcFollowupVerification::find($event->verificationId);

        if (!$verification) {
            return;
        }

        // If there is a linked complaint, update its resolution status.
        if ($verification->complaint_id && class_exists(FeedbackTicket::class)) {
            try {
                $complaint = FeedbackTicket::withoutGlobalScopes()->where('company_id', (int) $verification->company_id)->find($verification->complaint_id);
                if ($complaint && $complaint->status !== 'resolved') {
                    $complaint->status = 'resolved';
                    $complaint->resolved_at = now();
                    $complaint->save();

                    Log::info('[VerificationCompletedListener] Complaint resolved', [
                        'complaint_id' => $verification->complaint_id,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('[VerificationCompletedListener] Complaint update failed', ['error' => $e->getMessage()]);
            }
        }
    }
}

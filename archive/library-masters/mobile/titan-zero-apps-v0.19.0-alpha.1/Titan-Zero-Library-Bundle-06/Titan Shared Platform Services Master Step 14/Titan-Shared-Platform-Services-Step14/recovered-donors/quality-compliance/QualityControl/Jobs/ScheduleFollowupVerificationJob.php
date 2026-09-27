<?php

namespace Modules\QualityControl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\QualityControl\Entities\QcFollowupVerification;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Events\VerificationScheduledEvent;

class ScheduleFollowupVerificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public readonly int $qcRecordId,
        public readonly ?int $companyId = null,
        public readonly ?int $scheduleId = null,
        public readonly ?int $complaintId = null,
    ) {
    }

    public function handle(): void
    {
        $record = QcRecord::query()
            ->when($this->companyId, fn ($q) => $q->where('company_id', $this->companyId))
            ->find($this->qcRecordId);

        if (!$record) {
            Log::warning('[FollowupVerification] QcRecord not found', ['record_id' => $this->qcRecordId]);
            return;
        }

        // Idempotency check — do not create duplicate pending verifications.
        $existing = QcFollowupVerification::query()
            ->where('qc_record_id', $this->qcRecordId)
            ->whereIn('status', ['queued', 'assigned'])
            ->exists();

        if ($existing) {
            Log::info('[FollowupVerification] Pending verification already exists, skipping', [
                'record_id' => $this->qcRecordId,
            ]);
            return;
        }

        $deadlineHours = (int) config('quality_control.qc_verification_reminder_hours', 24);

        $verification = QcFollowupVerification::create([
            'company_id'   => $this->companyId ?? $record->company_id,
            'qc_record_id' => $record->id,
            'schedule_id'  => $this->scheduleId ?? $record->schedule_id,
            'complaint_id' => $this->complaintId ?? $record->complaint_id,
            'status'       => 'queued',
            'due_at'       => now()->addHours($deadlineHours),
        ]);

        VerificationScheduledEvent::dispatch($verification, 'job');

        Log::info('[FollowupVerification] Scheduled', [
            'record_id' => $record->id,
            'verification_id' => $verification->id,
        ]);
    }
}

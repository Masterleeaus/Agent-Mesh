<?php

namespace Modules\QualityControl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Mail\QcFailedMail;

class DispatchQcFailureNotificationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public readonly int $qcRecordId,
        public readonly ?int $companyId = null,
    ) {
    }

    public function handle(): void
    {
        $record = QcRecord::query()
            ->when($this->companyId, fn ($q) => $q->where('company_id', $this->companyId))
            ->find($this->qcRecordId);

        if (!$record) {
            Log::warning('[QcFailureNotifications] QcRecord not found', ['record_id' => $this->qcRecordId]);
            return;
        }

        Log::info('[QcFailureNotifications] Dispatching notifications', [
            'record_id' => $record->id,
            'company_id' => $record->company_id,
            'severity' => $record->severity_level,
        ]);

        $recipients = $this->resolveRecipients($record);

        foreach ($recipients as $email) {
            try {
                Mail::to($email)->queue(new QcFailedMail($record));
            } catch (\Throwable $e) {
                Log::warning('[QcFailureNotifications] Mail failed', ['email' => $email, 'error' => $e->getMessage()]);
            }
        }

        Log::info('[QcFailureNotifications] Done', ['record_id' => $record->id, 'sent_to' => count($recipients)]);
    }

    /**
     * Resolve recipient email addresses from company admins/site managers.
     * Falls back to an empty list if User / company is unavailable.
     */
    private function resolveRecipients(QcRecord $record): array
    {
        $emails = [];

        try {
            if (class_exists(\App\Models\User::class) && $record->company_id) {
                $emails = \App\Models\User::query()
                    ->where('company_id', $record->company_id)
                    ->whereHas('roles', fn ($r) => $r->whereIn('name', ['admin', 'superadmin']))
                    ->pluck('email')
                    ->filter()
                    ->unique()
                    ->values()
                    ->toArray();
            }
        } catch (\Throwable $e) {
            Log::debug('[QcFailureNotifications] Recipient resolution failed', ['error' => $e->getMessage()]);
        }

        return $emails;
    }
}

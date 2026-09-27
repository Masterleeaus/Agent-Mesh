<?php

namespace Modules\QualityControl\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Modules\QualityControl\Events\QcFailedEvent;
use Modules\QualityControl\Jobs\CreateComplaintFromCriticalQcFailureJob;
use Modules\QualityControl\Jobs\DispatchQcFailureNotificationsJob;
use Modules\QualityControl\Jobs\ScheduleFollowupVerificationJob;

class QcFailedListener implements ShouldQueue
{
    public string $queue = 'qc-automation';

    public function handle(QcFailedEvent $event): void
    {
        Log::info('[QcFailedListener] QcFailedEvent received', [
            'record_id' => $event->qcRecordId,
            'severity'  => $event->severityLevel,
        ]);

        DispatchQcFailureNotificationsJob::dispatch(
            $event->qcRecordId,
            $event->companyId
        )->onQueue('qc-automation');

        ScheduleFollowupVerificationJob::dispatch(
            $event->qcRecordId,
            $event->companyId
        )->onQueue('qc-automation');

        if ($this->isCritical($event->severityLevel)) {
            CreateComplaintFromCriticalQcFailureJob::dispatch(
                $event->qcRecordId,
                $event->companyId
            )->onQueue('qc-automation');
        }
    }

    private function isCritical(?string $severity): bool
    {
        return in_array($severity, ['high', 'critical'], true);
    }
}

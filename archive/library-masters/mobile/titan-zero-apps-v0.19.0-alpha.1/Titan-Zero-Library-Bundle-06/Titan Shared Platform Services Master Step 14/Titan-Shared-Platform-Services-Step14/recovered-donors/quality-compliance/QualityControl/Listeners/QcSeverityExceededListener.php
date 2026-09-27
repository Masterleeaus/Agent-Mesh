<?php

namespace Modules\QualityControl\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;
use Modules\QualityControl\Events\QcSeverityExceededEvent;
use Modules\QualityControl\Jobs\CreateComplaintFromCriticalQcFailureJob;

class QcSeverityExceededListener implements ShouldQueue
{
    public string $queue = 'qc-automation';

    public function handle(QcSeverityExceededEvent $event): void
    {
        Log::info('[QcSeverityExceededListener] QcSeverityExceededEvent received', [
            'record_id' => $event->qcRecordId,
            'severity'  => $event->severityLevel,
        ]);

        // Always create a complaint for severity-exceeded events.
        CreateComplaintFromCriticalQcFailureJob::dispatch(
            $event->qcRecordId,
            $event->companyId
        )->onQueue('qc-automation');
    }
}

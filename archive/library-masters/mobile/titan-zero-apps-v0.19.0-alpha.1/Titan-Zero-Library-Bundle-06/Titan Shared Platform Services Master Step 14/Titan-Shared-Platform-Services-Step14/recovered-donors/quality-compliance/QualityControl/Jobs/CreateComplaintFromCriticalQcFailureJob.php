<?php

namespace Modules\QualityControl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\QualityControl\Domain\Quality\Actions\CreateComplaintFromQcFailureAction;
use Modules\QualityControl\Entities\QcRecord;

class CreateComplaintFromCriticalQcFailureJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public readonly int $qcRecordId,
        public readonly int $companyId,
    ) {
    }

    public function handle(CreateComplaintFromQcFailureAction $action): void
    {
        if ($this->companyId <= 0) {
            throw new \InvalidArgumentException('company_id is required for queued QC complaint creation.');
        }

        $record = QcRecord::withoutGlobalScopes()
            ->where('company_id', $this->companyId)
            ->find($this->qcRecordId);

        if (!$record) {
            Log::warning('[CriticalQcFailure] QcRecord not found', ['record_id' => $this->qcRecordId]);
            return;
        }

        $threshold = config('quality_control.qc_auto_create_complaint_threshold', 'high');
        $severities = ['low', 'medium', 'high', 'critical'];
        $thresholdIndex = array_search($threshold, $severities, true);
        $recordIndex = array_search($record->severity_level ?? 'low', $severities, true);

        if ($thresholdIndex === false || $recordIndex < $thresholdIndex) {
            Log::info('[CriticalQcFailure] Severity below threshold, skipping complaint creation', [
                'record_id' => $record->id,
                'severity' => $record->severity_level,
                'threshold' => $threshold,
            ]);
            return;
        }

        $complaintId = $action->handle($record);

        Log::info('[CriticalQcFailure] Complaint created', [
            'record_id' => $record->id,
            'complaint_id' => $complaintId,
        ]);
    }
}

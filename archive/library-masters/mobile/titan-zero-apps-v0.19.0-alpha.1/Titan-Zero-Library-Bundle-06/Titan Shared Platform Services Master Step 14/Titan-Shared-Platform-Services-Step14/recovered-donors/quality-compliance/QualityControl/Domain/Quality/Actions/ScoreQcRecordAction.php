<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Events\QcFailedEvent;
use Modules\QualityControl\Events\QcSeverityExceededEvent;

final class ScoreQcRecordAction
{
    public function handle(QcRecord $record): QcRecord
    {
        $record->recalculateScore();

        $fresh = $record->fresh();

        if ($fresh->status === 'fail') {
            QcFailedEvent::dispatch($fresh, 'score_action');

            $threshold = $this->severityThresholdIndex();
            $recordIndex = $this->severityIndex($fresh->severity_level ?? 'low');

            if ($recordIndex >= $threshold) {
                QcSeverityExceededEvent::dispatch($fresh, 'score_action');
            }
        }

        return $fresh;
    }

    private function severityIndex(?string $level): int
    {
        $idx = array_search($level ?? 'low', ['low', 'medium', 'high', 'critical'], true);
        return $idx !== false ? (int) $idx : 0;
    }

    private function severityThresholdIndex(): int
    {
        $threshold = config('quality_control.qc_auto_create_complaint_threshold', 'high');
        $idx = array_search($threshold, ['low', 'medium', 'high', 'critical'], true);
        return $idx !== false ? (int) $idx : 2;
    }
}

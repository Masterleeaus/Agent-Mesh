<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\QcRecord;

final class FailQcRecordAction
{
    public function handle(QcRecord $record, ?string $severity = null): QcRecord
    {
        $record->status = 'fail';

        if (!is_null($severity) && property_exists($record, 'severity_level')) {
            $record->severity_level = $severity;
        }

        $record->save();

        return $record->fresh();
    }
}

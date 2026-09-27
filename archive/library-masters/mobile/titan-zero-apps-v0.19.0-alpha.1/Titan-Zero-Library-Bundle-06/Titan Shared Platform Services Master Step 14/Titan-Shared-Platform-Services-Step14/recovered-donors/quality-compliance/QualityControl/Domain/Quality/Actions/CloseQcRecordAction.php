<?php

namespace Modules\QualityControl\Domain\Quality\Actions;

use Modules\QualityControl\Entities\QcRecord;

final class CloseQcRecordAction
{
    public function handle(QcRecord $record): QcRecord
    {
        $record->status = 'reclean_done';

        if (property_exists($record, 'reclean_status')) {
            $record->reclean_status = 'verified';
        }

        $record->save();

        return $record->fresh();
    }
}
